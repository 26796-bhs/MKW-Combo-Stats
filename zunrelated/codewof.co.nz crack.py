import requests
import time


cookies = {
    "csrftoken": "fWqrOMRLx1cBAqxEb5iBrVNuB47Z9WdSYMsICd6qPJTCKApp94OBM6wYZR6INMvp",
    "sessionid": "7wx4lotkch1vcoloi83kq2womk7j14h3"
}
X_CSRFToken = "fZhtKgwTdnQ1yTMp9i39s617ZExPfN7GYPjKyHLyv5x2I3Ea7hz9NhKBnrwyTDpd" #console.log(csrf_token)
start = 43
cd = 0.05


def __sendCode__(questionId, csrftoken, sessionid):
    return requests.post(
        "https://codewof.co.nz/ajax/save_question_attempt/",
        json = {
            "user_input": "Cracked LOL",
            "question": questionId,
            "test_cases": {
                "1": {
                    "id": 1,
                    "languages":["en"],
                    "number":1,
                    "type":"Program",
                    "expected_output": "",
                    "testcase_ptr_id":1,
                    "test_code":"",
                    "question_id":questionId,
                    "received_output":"",
                    "passed":True,
                    "runtime_error":False
                },
            }
        },
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
            "Content-Type": "application/json",
            "Origin": "https://codewof.co.nz",
            "Referer": f"https://codewof.co.nz/{questionId}",
            "sec-ch-ua": '"Chromium";v="148", "Google Chrome";v="148", "Not/A)Brand";v="99"',
            "sec-fetch-site": "same-origin",
            "X-CSRFToken": X_CSRFToken,
            "x-requested-with": "XMLHttpRequest"
        },
        cookies={
            "csrftoken": csrftoken,
            "sessionid": sessionid
        }
    )

if cookies and X_CSRFToken and cookies["csrftoken"] and cookies["sessionid"]:
    for i in range(start, 163):
        response = __sendCode__(i, cookies["csrftoken"], cookies["sessionid"])
        if response.status_code == 200:
            print("Successfully cracked question id: "+str(i))
        elif response.status_code != 500:
            print("Failed\n---[Details]--- ")
            print(f"Status Code: {response.status_code}") # Plausible returns 202 if successful
            print(response.text)
            break
        else:
            print("Skipping question id "+str(i)+" as question does not exist.")
        time.sleep(cd)