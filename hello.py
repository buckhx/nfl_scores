import os
from flask import Flask, render_template

app = Flask(__name__, static_folder="crossfilter", template_folder="crossfilter")
app.debug=True

@app.route('/')
def hello():
  return render_template('index.html')	
