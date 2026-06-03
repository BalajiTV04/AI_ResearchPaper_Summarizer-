try:
    import uvicorn
    print("uvicorn OK: " + uvicorn.__version__)
except Exception as e:
    print("uvicorn FAIL: " + str(e))

try:
    import fastapi
    print("fastapi OK: " + fastapi.__version__)
except Exception as e:
    print("fastapi FAIL: " + str(e))

try:
    import mysql.connector
    print("mysql.connector OK")
except Exception as e:
    print("mysql.connector FAIL: " + str(e))

try:
    import google.generativeai
    print("google.generativeai OK")
except Exception as e:
    print("google.generativeai FAIL: " + str(e))