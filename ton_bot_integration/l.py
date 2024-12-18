
st = "38b162ae7af095971c65824e767e1d312402f02030d2e47df9551d055d21ca60"
#from sys import getsizeof
#print(getsizeof("38b162ae7af095971c65824e767e1d312402f02030d2e47df9551d055d21ca60"))

raw_size = len(st.encode('utf-8'))

print(f"The raw size of the string content in bytes is: {raw_size}")

import sys

size_in_bytes = sys.getsizeof(st)

print(f"The size of the string in bytes is: {size_in_bytes}")
