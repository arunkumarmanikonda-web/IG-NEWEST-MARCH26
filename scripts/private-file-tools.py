"""Run only in a disposable, network-denied VM after the original is downloaded."""
import csv
import hashlib
import json
from pathlib import Path
import re
import subprocess
import time

ROOT = Path('/vercel/sandbox/job')
LIMIT = 20 * 1024 * 1024

def command(args, timeout=75):
    return subprocess.run(args, capture_output=True, text=True, timeout=timeout)

def scan(path):
    result = command(['clamscan', '--no-summary', '--max-filesize=1024M', '--max-scansize=2048M',
                      '--max-files=20000', '--max-recursion=30', '--alert-exceeds-max=yes', '--alert-encrypted=yes', str(path)], 100)
    if result.returncode == 0:
        return 'clean'
    if result.returncode == 1 and not any(marker in result.stdout for marker in ['Heuristics.Limits.Exceeded','Heuristics.Encrypted']):
        return 'infected'
    raise ValueError('Antivirus could not completely scan this file within the processing limits.')

def property_value(name, value):
    import uno
    result = uno.createUnoStruct('com.sun.star.beans.PropertyValue')
    result.Name, result.Value = name, value
    return result

def office_pdf(source, output):
    import uno
    from com.sun.star.document.MacroExecMode import NEVER_EXECUTE
    from com.sun.star.document.UpdateDocMode import NO_UPDATE
    profile = ROOT / 'office-profile'
    process = subprocess.Popen(['libreoffice', '--headless', '--norestore', '--nodefault', '--nofirststartwizard',
        '-env:UserInstallation=' + profile.as_uri(), '--accept=pipe,name=igconvert;urp;StarOffice.ComponentContext'],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    document = None
    try:
        local = uno.getComponentContext()
        resolver = local.ServiceManager.createInstanceWithContext('com.sun.star.bridge.UnoUrlResolver', local)
        context = None
        for _ in range(100):
            try:
                context = resolver.resolve('uno:pipe,name=igconvert;urp;StarOffice.ComponentContext')
                break
            except Exception:
                time.sleep(.1)
        if context is None:
            raise ValueError('Document converter did not start.')
        desktop = context.ServiceManager.createInstanceWithContext('com.sun.star.frame.Desktop', context)
        options = tuple(property_value(k, v) for k, v in [('Hidden', True), ('ReadOnly', True),
            ('MacroExecutionMode', NEVER_EXECUTE), ('UpdateDocMode', NO_UPDATE)])
        # Macros and link updates are disabled; network access is also denied by the VM firewall.
        if source.suffix == '.csv':
            text = source.read_bytes().decode('utf-8-sig')
            try:
                dialect = csv.Sniffer().sniff(text[:8192], delimiters=',;\t|')
            except csv.Error:
                dialect = csv.excel
            rows = list(csv.reader(text.splitlines(), dialect))
            if len(rows) > 30000 or max(map(len, rows), default=0) > 100:
                raise ValueError('CSV needs an administrator-prepared preview because of its dimensions.')
            document = desktop.loadComponentFromURL('private:factory/scalc', '_blank', 0, options)
            sheet = document.Sheets.getByIndex(0)
            for row_number, row in enumerate(rows):
                for column, value in enumerate(row):
                    sheet.getCellByPosition(column, row_number).setString(value)
            sheet.getCellRangeByPosition(0, 0, max(map(len, rows), default=1)-1, max(len(rows)-1, 0)).getColumns().OptimalWidth = True
        else:
            document = desktop.loadComponentFromURL(source.as_uri(), '_blank', 0, options)
        if document is None:
            raise ValueError('Document is encrypted or unsupported by the converter.')
        is_sheet = document.supportsService('com.sun.star.sheet.SpreadsheetDocument')
        if is_sheet:
            styles = document.StyleFamilies.getByName('PageStyles')
            for sheet in document.Sheets:
                if not sheet.IsVisible:
                    continue
                style = styles.getByName(sheet.PageStyle)
                style.ScaleToPagesX, style.ScaleToPagesY = 1, 0
            filter_name = 'calc_pdf_Export'
        elif document.supportsService('com.sun.star.presentation.PresentationDocument'):
            filter_name = 'impress_pdf_Export'
        elif document.supportsService('com.sun.star.text.TextDocument'):
            filter_name = 'writer_pdf_Export'
        else:
            filter_name = 'draw_pdf_Export'
        data = tuple(property_value(k, v) for k, v in [('ExportFormFields', False), ('ExportBookmarks', True),
            ('ReduceImageResolution', True), ('MaxImageResolution', 160), ('Quality', 85), ('ExportHiddenSlides', False)])
        document.storeToURL(output.as_uri(), (property_value('FilterName', filter_name), property_value('FilterData', data)))
    finally:
        if document:
            document.close(True)
        process.terminate()
        try:
            process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            process.kill()

def process_file():
    metadata = json.loads((ROOT / 'metadata.json').read_text())
    source = ROOT / ('original.' + metadata['extension'])
    digest = hashlib.sha256()
    with source.open('rb') as data:
        for chunk in iter(lambda: data.read(1024 * 1024), b''):
            digest.update(chunk)
    report = {'sha256': digest.hexdigest(), 'scan': scan(source),
              'engine': command(['clamscan', '--version'], 10).stdout.strip(), 'preview': False}
    if report['scan'] != 'clean':
        return report
    if not metadata['needs_preview'] or metadata['extension'] == 'zip':
        return report
    try:
        output = ROOT / 'preview.pdf'
        if metadata['extension'] == 'pdf':
            r = command(['gs', '-sDEVICE=pdfwrite', '-dSAFER', '-dBATCH', '-dNOPAUSE', '-dCompatibilityLevel=1.6',
                '-dPDFSETTINGS=/ebook', '-dDetectDuplicateImages=true', '-sOutputFile=' + str(output), str(source)], 110)
            if r.returncode:
                raise ValueError('PDF optimisation could not preserve a readable document.')
            before = command(['pdfinfo', str(source)]).stdout
            after = command(['pdfinfo', str(output)]).stdout
            if re.search(r'^Pages:\s*(\d+)', before, re.M).group(1) != re.search(r'^Pages:\s*(\d+)', after, re.M).group(1):
                raise ValueError('Optimised preview page count differs from the original.')
        else:
            office_pdf(source, output)
        if not output.exists() or output.stat().st_size > LIMIT or not output.read_bytes().startswith(b'%PDF-'):
            raise ValueError('Converted preview exceeds the safe preview size or is incomplete.')
        info = command(['pdfinfo', str(output)]).stdout
        pages = re.search(r'^Pages:\s*(\d+)', info, re.M)
        if not pages or not 1 <= int(pages.group(1)) <= 500:
            raise ValueError('Converted preview exceeds the page limit; split the original into sections.')
        if scan(output) != 'clean':
            raise ValueError('Generated preview did not pass antivirus checking.')
        report.update(preview=True, preview_bytes=output.stat().st_size, pages=int(pages.group(1)),
                      preview_sha256=hashlib.sha256(output.read_bytes()).hexdigest())
    except Exception:
        report['preview_error'] = 'Automatic preview could not finish safely. Retry processing or attach an administrator-prepared PDF.'
    return report

if __name__ == '__main__':
    try:
        report = process_file()
    except Exception as error:
        report = {'scan': 'held', 'error': str(error)[:300]}
    (ROOT / 'result.json').write_text(json.dumps(report))
