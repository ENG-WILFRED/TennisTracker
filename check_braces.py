from pathlib import Path
text = Path('src/app/players/profile/[playerId]/page.tsx').read_text()
count_open = 0
count_close = 0
in_single = in_double = in_back = False
esc = False
for ch in text:
    if esc:
        esc = False
        continue
    if ch == '\\':
        esc = True
        continue
    if in_single:
        if ch == "'":
            in_single = False
        continue
    if in_double:
        if ch == '"':
            in_double = False
        continue
    if in_back:
        if ch == '`':
            in_back = False
        continue
    if ch == "'":
        in_single = True
    elif ch == '"':
        in_double = True
    elif ch == '`':
        in_back = True
    elif ch == '{':
        count_open += 1
    elif ch == '}':
        count_close += 1
print('braces', count_open, count_close, count_open - count_close)
