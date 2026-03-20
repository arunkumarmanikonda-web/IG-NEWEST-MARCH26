#!/usr/bin/env python3
import re

with open('src/routes/api.tsx', 'r') as f:
    content = f.read()

# Only fix the one we know is bad (L15232) — the }))) at the end of the horeca/quote handler
# The other }))) at L7697 is legitimate (it's inside a .map chain)

# Target: the handler closing }))) at the end of the GET /horeca/quote D1 handler
TARGET = "  return (c as any).json({ source:'static', quotes:[] })\n}))\n"
FIXED  = "  return (c as any).json({ source:'static', quotes:[] })\n})\n"

if TARGET in content:
    content = content.replace(TARGET, FIXED)
    print("Fixed: GET /horeca/quote extra ))")
else:
    # Try to find it by scanning
    lines = content.splitlines()
    for i, line in enumerate(lines):
        if line.strip() == '}))' and i > 0 and 'horeca/quote' in '\n'.join(lines[max(0,i-20):i]):
            lines[i] = '})'
            content = '\n'.join(lines) + '\n'
            print("Fixed by scan at L{}".format(i+1))
            break
    else:
        print("Pattern not found — checking line 15232 directly")
        lines = content.splitlines()
        # Line 15232 is index 15231
        idx = 15231
        print("L15232: " + repr(lines[idx]))
        print("L15231: " + repr(lines[idx-1]))
        print("L15230: " + repr(lines[idx-2]))
        if lines[idx].strip() == '}))':
            lines[idx] = '})'
            content = '\n'.join(lines) + '\n'
            print("Fixed by direct index")

with open('src/routes/api.tsx', 'w') as f:
    f.write(content)
print("Saved. Lines: " + str(len(content.splitlines())))
