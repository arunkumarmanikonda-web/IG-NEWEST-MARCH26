from pathlib import Path
import json,subprocess,time,sys,re

out=Path('qa-output/native-ios');out.mkdir(parents=True,exist_ok=True)
state=out/'device.json'
def call(*args):
    return subprocess.check_output(['xcrun','simctl',*args],text=True)
if '--prepare' in sys.argv:
    devices=json.loads(call('list','devices','available','--json'))['devices']
    runtimes=sorted((r for r in devices if '.iOS-' in r),key=lambda r:tuple(map(int,re.findall(r'\d+',r))),reverse=True)
    runtime=next(r for r in runtimes if any(d.get('isAvailable') and d['name'].startswith('iPhone') for d in devices[r]))
    phone=next(d for d in devices[runtime] if d.get('isAvailable') and d['name'].startswith('iPhone'))
    # A fresh device on the newest installed iOS avoids upgrading a pre-seeded
    # runner device. Boot while Xcode compiles, then require readiness below.
    udid=call('create','India Gully QA',phone['deviceTypeIdentifier'],runtime).strip()
    state.write_text(json.dumps({'udid':udid,'name':phone['name'],'runtime':runtime}))
    call('boot',udid)
    raise SystemExit(0)
phone=json.loads(state.read_text());udid=phone['udid']
subprocess.run(['xcrun','simctl','bootstatus',udid,'-b'],check=True,timeout=300)
apps=list(Path('build').glob('*.app'))
if len(apps)!=1: raise SystemExit('Expected exactly one compiled app')
call('install',udid,str(apps[0]))
call('status_bar',udid,'override','--time','9:41','--batteryState','charged','--batteryLevel','100')
result=call('launch',udid,'com.indiagully.app')
if 'com.indiagully.app:' not in result: raise SystemExit('Application did not launch')
time.sleep(30)
call('io',udid,'screenshot',str(out/'home.png'))
(out/'manifest.json').write_text(json.dumps({'kind':'Native iOS simulator screenshot','device':phone['name'],'runtime':phone['runtime'],'application':'com.indiagully.app','launch':result.strip()},indent=2))
