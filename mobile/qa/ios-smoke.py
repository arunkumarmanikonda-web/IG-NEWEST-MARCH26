from pathlib import Path
import json,subprocess,time

def call(*args):
    return subprocess.check_output(['xcrun','simctl',*args],text=True)
devices=json.loads(call('list','devices','available','--json'))['devices']
phone=next((d for values in devices.values() for d in values if d.get('isAvailable') and d['name'].startswith('iPhone')),None)
if not phone: raise SystemExit('No iPhone simulator available')
udid=phone['udid']
if phone['state']!='Booted': call('boot',udid)
subprocess.run(['xcrun','simctl','bootstatus',udid,'-b'],check=True,timeout=180)
apps=list(Path('build').glob('*.app'))
if len(apps)!=1: raise SystemExit('Expected exactly one compiled app')
call('install',udid,str(apps[0]))
call('status_bar',udid,'override','--time','9:41','--batteryState','charged','--batteryLevel','100')
result=call('launch',udid,'com.indiagully.app')
if 'com.indiagully.app:' not in result: raise SystemExit('Application did not launch')
time.sleep(30)
out=Path('qa-output/native-ios');out.mkdir(parents=True,exist_ok=True)
call('io',udid,'screenshot',str(out/'home.png'))
(out/'manifest.json').write_text(json.dumps({'kind':'Native iOS simulator screenshot','device':phone['name'],'application':'com.indiagully.app','launch':result.strip()},indent=2))
