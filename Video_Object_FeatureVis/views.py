from django.shortcuts import render,HttpResponse
import json
# Create your views here.
#必须加参数；一般都用request【是请求信息对象】;HttpResponse【是响应信息对象】
def Hello(request):
    #返回一个字符串
    #return  HttpResponse("<h1>welcome python zhangyu</h1>")
    #返回页面;第一次参数是request；第二个参数是在templates目录下的文件；不需要导入；直接写就可以
    return render(request,"index.html")


def index(request):
    points = readPoint()
    return render(request,"index.html",{'points':points})

#读取降维结果
def readPoint():
    with open('static\data\json_tsne3368_512_concat.json',"r", newline='', encoding='utf-8') as file:
        json_data = json.load(file)
        return json_data