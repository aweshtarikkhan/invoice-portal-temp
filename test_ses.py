import smtplib
from email.mime.text import MIMEText

msg = MIMEText('test')
msg['Subject'] = 'test'
msg['From'] = 'no-reply@aassaybiz.com'
msg['To'] = 'testunverified999@maxtanie.com'

try:
    server = smtplib.SMTP('email-smtp.ap-south-1.amazonaws.com', 587)
    server.starttls()
    server.login('AKIA2LJCCXAWLPSYPMPE', 'BAxlpu5HTiNPIdt7NRhHnENs2tbnczd/J3PLt/uJfNk5')
    server.sendmail('no-reply@aassaybiz.com', ['testunverified999@maxtanie.com'], msg.as_string())
    server.quit()
    print('SUCCESS')
except Exception as e:
    print('FAILED:', type(e), e)
