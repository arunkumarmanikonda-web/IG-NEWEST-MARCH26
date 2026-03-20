#!/usr/bin/env python3
import re

with open('src/routes/api.tsx', 'r') as f:
    content = f.read()

# Find and fix }))) patterns (extra closing parens from string replacement)
bad1 = list(re.finditer(r'\}\)\)\)', content))
print("Found {} '}})))' patterns:".format(len(bad1)))
for m in bad1[:10]:
    line_num = content[:m.start()].count('\n') + 1
    ctx = content[max(0,m.start()-50):m.start()+30]
    print("  L{}: {}".format(line_num, repr(ctx)))

# Fix from end to preserve positions
for m in reversed(bad1):
    line_num = content[:m.start()].count('\n') + 1
    content = content[:m.start()] + '})' + content[m.start()+4:]
    print("Replaced }))) at L{}".format(line_num))

# Find and fix })) at end-of-line (double close)
bad2 = list(re.finditer(r'\}\)\)\n', content))
print("\nFound {} '}))\\n' patterns:".format(len(bad2)))
for m in bad2[:10]:
    line_num = content[:m.start()].count('\n') + 1
    ctx = content[max(0,m.start()-50):m.start()+10]
    print("  L{}: {}".format(line_num, repr(ctx)))

for m in reversed(bad2):
    line_num = content[:m.start()].count('\n') + 1
    content = content[:m.start()] + '})\n' + content[m.start()+4:]
    print("Replaced }})\\n at L{}".format(line_num))

with open('src/routes/api.tsx', 'w') as f:
    f.write(content)
print("\napi.tsx saved, {} lines".format(len(content.splitlines())))
