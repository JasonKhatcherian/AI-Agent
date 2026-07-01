from functions.get_files_info import get_files_info

print('get_files_info("calculator", "."):\nResult for current directory:')
print(get_files_info("calculator", "."))

print('\nget_files_info("calculator", "/bin"):\nResult for /bin:')
print(get_files_info("calculator", "/bin"))

print('\nget_files_info("calculator", "../"):\nResult for ../:')
print(get_files_info("calculator", "../"))

print('\nget_files_info("calculator", "main.py"):\nResult for main.py:')
print(get_files_info("calculator", "main.py"))
