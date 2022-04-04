from django.shortcuts import render
from django.http import JsonResponse
from sklearn.manifold import TSNE
from sklearn.cluster import DBSCAN
import numpy as np
import pymysql
import math
import json
import pandas
from Graph_propagation import LapSVM
from Pixel_based_encoding import PixelBar

def query(request):
    return render(request, "query.html")


def index(request):
    return render(request, "index.html")



def getConnect_db():
    db = pymysql.connect(host='localhost', port=3306, user='root', passwd='1105', db='movie', charset='utf8')
    return db


"""
-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
图传播反馈
-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
"""

def graph_propagation(request):
    if request.method == "POST":
        dict = request.POST.get("dict", None)
        pid = request.POST.get("pid", None)
        print("dict&pid---------------------------------------------------------")
        dict = eval(dict)
        pid = eval(pid)
        print(dict)
        print(pid)

        dict = LapSVM.LapSVM_rerank(pid, dict)
        # 遍历每一个

        return JsonResponse(json.dumps(dict, ensure_ascii=False), safe=False)

"""
-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
kendall_tau_distance
-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
"""


def kendall_tau_distance(a, b):
    n = len(a)
    ainv = [0] * n

    for i in range(0, n):
        ainv[a[i]] = i

    bnew = [0] * n
    for j in range(0, n):
        bnew[j] = ainv[b[j]]

    # print(ainv)
    # print(bnew)
    return inversion(bnew)


def inversion(A):
    lent = len(A)
    if lent < 2:
        return 0, A
    mid = lent // 2
    left = A[:mid]
    right = A[mid:]
    count_left, left = inversion(left)
    count_right, right = inversion(right)
    count_left_right, mergeA = merge(left, right)
    # return count_left + count_right + count_left_right, mergeA
    return count_left + count_right + count_left_right, mergeA


def merge(left, right):
    alist = []
    lenl = len(left)
    lenr = len(right)
    i, j, inver = 0, 0, 0
    while i < lenl and j < lenr:
        if left[i] <= right[j]:  # left[i]于right[j]及right[i]的元素都不构成逆序对
            alist.append(left[i])
            i += 1
        else:
            inver += lenl - i  # 先计数，再排序
            alist.append(right[j])
            j += 1
    while i < lenl:
        alist.append(left[i])
        i += 1
    while j < lenr:
        alist.append(right[j])
        j += 1
    return inver, alist




"""
-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
针对query.html展示数据的一些函数
-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
"""


# 使用已经生成好的数据文件ground_truth.json
# 使用前几位检索
def show_front(request):
    front = request.POST.get("front", None)
    front = eval(front)
    front = int(front)
    dict = {}
    pid_list = []
    with open('static\data\ForQueryFilter\QGpath_true3368.json', "r", newline='', encoding='utf-8') as file:
        json_data = json.load(file)
    json_data = json_data["dict_true"]
    # 前多少个
    index = 0
    for key in json_data:
        if index < front:
            pid_list.append(key)
        index = index + 1

    print("pid_list-------------------------------------------------------------------------------------")
    print(pid_list)
    print(len(pid_list))

    picture_path_list = {}
    picture_true_list = {}
    true_list = {}
    index_list = {}
    path_list = {}
    with open('static\data\query_html\ground_truth.json', "r", newline='',
              encoding='utf-8') as file:
        gt = json.load(file)
    print("finish:read ground truth")
    for i in range(100, len(pid_list)):
        picture_path_list[pid_list[i]] = gt["picture_path_list"][pid_list[i]]
        picture_true_list[pid_list[i]] = gt["picture_true_list"][pid_list[i]]
        true_list[pid_list[i]] = gt["true_list"][pid_list[i]]
        index_list[pid_list[i]] = gt["index_list"][pid_list[i]]
        path_list[pid_list[i]] = gt["path_list"][pid_list[i]]

    dict["picture_path_list"] = picture_path_list
    dict["picture_true_list"] = picture_true_list
    dict["true_list"] = true_list
    dict["index_list"] = index_list
    dict["path_list"] = path_list

    return JsonResponse(json.dumps(dict, ensure_ascii=False), safe=False)


# 使用已经生成好的数据文件ground_truth.json
# 使用错误个数检索
def filter(request):
    error_type = request.POST.get("error_type", None)
    error_type = str(error_type)

    errornum = request.POST.get("errornum", None)
    errornum = float(errornum)

    headnum = request.POST.get("headnum", None)
    headnum = int(headnum)

    dict = {}
    pid_list = []
    with open('static\data\ForQueryFilter\QGpath_true3368.json', "r", newline='', encoding='utf-8') as file:
        json_data = json.load(file)
    json_data = json_data["dict_true"]

    # 0错 1对
    if error_type == '\"错误个数\"':
        print("进入错误个数模式")
        for key in json_data:
            rank_list = json_data[key]
            rnum = 0
            for t in range(0, headnum):
                if rank_list[t] == 0:
                    rnum = rnum + 1
            if rnum >= errornum:
                print(rank_list)
                pid_list.append(key)

    if error_type == '\"正确个数\"':
        print("进入正确个数模式")
        for key in json_data:
            rank_list = json_data[key]
            rnum = 0
            for t in range(0, headnum):
                if rank_list[t] == 1:
                    rnum = rnum + 1
            if rnum >= errornum:
                print(rank_list)
                pid_list.append(key)

    if error_type == '\"错误比率\"':
        print("进入错误比率模式")
        for key in json_data:
            rank_list = json_data[key]
            fnum = 0
            for t in range(0, headnum):
                if rank_list[t] == 0:
                    fnum = fnum + 1
            if (fnum / headnum) >= errornum:
                pid_list.append(key)

    print("pid_list")
    print(pid_list)

    print(len(pid_list))
    picture_path_list = {}
    picture_true_list = {}
    true_list = {}
    index_list = {}
    path_list = {}
    with open('static\data\query_html\ground_truth.json', "r", newline='',
              encoding='utf-8') as file:
        gt = json.load(file)
    print("finish:read ground truth")
    for i in range(0, len(pid_list)):
        picture_path_list[pid_list[i]] = gt["picture_path_list"][pid_list[i]]
        picture_true_list[pid_list[i]] = gt["picture_true_list"][pid_list[i]]
        true_list[pid_list[i]] = gt["true_list"][pid_list[i]]
        index_list[pid_list[i]] = gt["index_list"][pid_list[i]]
        path_list[pid_list[i]] = gt["path_list"][pid_list[i]]

    dict["picture_path_list"] = picture_path_list
    dict["picture_true_list"] = picture_true_list
    dict["true_list"] = true_list
    dict["index_list"] = index_list
    dict["path_list"] = path_list

    return JsonResponse(json.dumps(dict, ensure_ascii=False), safe=False)


# 使用已经生成好的数据文件ground_truth.json
# 使用文件名检索
def filter_pid(request):
    pid = request.POST.get("pid", None)
    pid = eval(pid)
    print(pid)
    dict = {}
    pid_list = []
    pid_list.append("http://127.0.0.1:8000/static/data/image/query/" + pid)
    print(pid_list)

    print(len(pid_list))
    picture_path_list = {}
    picture_true_list = {}
    true_list = {}
    index_list = {}
    path_list = {}
    with open('static\data\query_html\ground_truth.json', "r", newline='',
              encoding='utf-8') as file:
        gt = json.load(file)
    print("finish:read ground truth")
    for i in range(0, len(pid_list)):
        picture_path_list[pid_list[i]] = gt["picture_path_list"][pid_list[i]]
        picture_true_list[pid_list[i]] = gt["picture_true_list"][pid_list[i]]
        true_list[pid_list[i]] = gt["true_list"][pid_list[i]]
        index_list[pid_list[i]] = gt["index_list"][pid_list[i]]
        path_list[pid_list[i]] = gt["path_list"][pid_list[i]]

    dict["picture_path_list"] = picture_path_list
    dict["picture_true_list"] = picture_true_list
    dict["true_list"] = true_list
    dict["index_list"] = index_list
    dict["path_list"] = path_list

    return JsonResponse(json.dumps(dict, ensure_ascii=False), safe=False)


#
def getAim_tojson(request):
    print("不返回了")
    # 目标pid
    pid = request.POST.get("pid", None)
    pid = eval(pid)
    print(pid)

    # 选择展示的rank数量
    g_num = request.POST.get("g_num", None)
    g_num = eval(g_num)
    g_num = int(g_num)
    print(g_num)

    # 选择进行降维的特征
    # F = 0  # model feature
    # F = 1  # attributes
    # F = 2  # fusion
    F = 0
    getAim0(pid, g_num, F)

    dict = {}
    return JsonResponse(json.dumps(dict, ensure_ascii=False), safe=False)


def Euclidean_Distance(f1, f2):
    sum = 0
    for i in range(0, len(f1)):
        sum = sum + (f1[i] - f2[i]) * (f1[i] - f2[i])
    dis = math.sqrt(sum)
    return dis




def getAim0(path_name, N, F):
    # 输入一个probe
    # pid = "\"http://127.0.0.1:8000/static/data/image/query/1239_c2s3_012107_00.jpg\""
    # path_name = pid[1:-1][46:]
    # print(path_name)
    compression_data = pandas.read_json("static\data\compression_data.json")
    compression_data_query = pandas.read_json("static\data\compression_data_query.json")
    query_color = compression_data_query[path_name]
    # 获取qg
    query = pandas.read_json("static\data\data_delete0000\query.json")
    aimqg = query.loc[query['path_name'] == path_name]["newqg"].tolist()
    aimqg = aimqg[0]

    # 获取gallery
    gallery = pandas.read_json("static\data\data_delete0000\gallery.json")

    # aimqg信息
    dict = {}
    dict0 = {}

    path_name_list = []
    feature_list = []
    attribute_list = []
    fusion_list = []
    rank_list = []
    dis_fangcha = []

    # aimqg:["path_name","gallery_feature","gallery_attributes","fusion","rank"]
    # for i in range(0, len(aimqg)):
    for i in range(0, N):
        # "gallery_feature"
        feature_list.append(gallery.loc[gallery["id"] == aimqg[i]]["gallery_feature"].tolist()[0])
        # "gallery_attributes"
        attribute_list.append(gallery.loc[gallery["id"] == aimqg[i]]["gallery_attributes"].tolist()[0])
        # "gallery_attributes"
        fusion_list.append(gallery.loc[gallery["id"] == aimqg[i]]["gallery_feature"].tolist()[0] +
                           gallery.loc[gallery["id"] == aimqg[i]]["gallery_attributes"].tolist()[0])
        # "path_name"
        path_name_list.append("http://127.0.0.1:8000/static/data/image/bounding_box_test/" +
                              gallery.loc[gallery["id"] == aimqg[i]]["path_name"].iloc[0])
        # "rank"
        rank_list.append(i)
        # 颜色方差
        p = gallery.loc[gallery["id"] == aimqg[i]]["path_name"].iloc[0]
        p_color = compression_data[p]
        dis_fangcha.append(PixelBar.dis_fc(query_color, p_color))

    dict0["feature_list"] = feature_list

    # 对模型特征进行归一化
    feature_list = np.array(feature_list)
    feature_list_normed = feature_list / feature_list.max(axis=0)

    # 对属性特征进行归一化
    attribute_list = np.array(attribute_list)
    attribute_list_normed = attribute_list / attribute_list.max(axis=0)

    # 对混合特征进行归一化
    fusion_list = np.array(fusion_list)
    fusion_list_normed = fusion_list / fusion_list.max(axis=0)

    # 选择要进行降维的特征
    if F == 0:
        F_list_normed = feature_list
    if F == 1:
        F_list_normed = attribute_list
    if F == 2:
        F_list_normed = fusion_list

    # 计算距离矩阵
    # F_distance=[]
    # for i in range(0,len(F_list_normed)):
    #     distance_vec=[]
    #     for j in range(0,len(F_list_normed)):
    #         distance_vec.append(Euclidean_Distance(F_list_normed[i],F_list_normed[j]))
    #     F_distance.append(distance_vec)

    layout_dict={}
    print("F_list_normed")
    print(F_list_normed.tolist())
    # T-sne得到二维投影
    X = np.array(F_list_normed)
    tsne = TSNE(n_components=2,init='pca')
    F_tsne_result = tsne.fit_transform(X)
    F_tsne_result = F_tsne_result.tolist()
    print("初始的tsne结果：")
    print(F_tsne_result)
    # layout_dict["F_list_normed"]=F_list_normed.tolist()
    # layout_dict["F_tsne_result"]=F_tsne_result
    # with open("static/data/layout_dict_init.json", 'w', encoding='utf-8') as file:
    #     file.write(json.dumps(layout_dict, indent=2, ensure_ascii=False))


    # 使用DBCSAN聚类获得每一个样本的label
    db = DBSCAN(eps=1.6, min_samples=2).fit(F_tsne_result)
    core_samples_mask = np.zeros_like(db.labels_, dtype=bool)
    core_samples_mask[db.core_sample_indices_] = True
    labels = db.labels_
    labels = labels.tolist()

    # 获取true_list
    picture_true_list = query.loc[query['path_name'] == path_name]["true_list"].tolist()
    picture_true_list = picture_true_list[0]

    # aimqg:["query","picture_true_list","picture_path_list","feature_tsne_result","rank_list","lables"]
    dict["query"] = "http://127.0.0.1:8000/static/data/image/query/" + path_name
    dict["picture_true_list"] = picture_true_list[0:N]
    dict["picture_path_list"] = path_name_list
    dict["feature_tsne_result"] = F_tsne_result
    dict["rank_list"] = rank_list
    dict["lables"] = labels
    dict["dis_fangcha"] = dis_fangcha

    # 图传播算法的输入数据
    dict0["picture_path_list"] = path_name_list
    # dict0["feature_list"] = feature_list
    dict0["picture_true_list"] = picture_true_list[0:N]

    # ['query','picture_true_list','picture_path_list','feature_tsne_result','rank_list','lables']
    dict_dataframe = pandas.DataFrame(dict)
    # print(dict_dataframe)

    """
    -----------------------------------------------------------------------------------------------------------------------------------------------------------------------
    grid布局数据["cluster":[["path_list"], "bianchang", "center",["rank_list"]],"center":[],"bian":[]]
    -----------------------------------------------------------------------------------------------------------------------------------------------------------------------
    """
    dict_dataframe = dict_dataframe.groupby('lables')
    cluster = []
    center = []
    bian = []
    cluster_index = 0
    ci_list = {}

    for name, group in dict_dataframe:
        # print(name)
        # print(group.columns.values)
        if (name == -1):
            for index, row in group.iterrows():
                # print("row")
                # print(row)
                # {["path_list"], "bianchang", "center",["rank_list"]}
                cluster.append([[row["picture_path_list"]], 1, row["feature_tsne_result"], [row["rank_list"]]])
                ci_list[index] = cluster_index
                cluster_index = cluster_index + 1
                center.append(row["feature_tsne_result"])
                bian.append(1)
        else:
            path_list = group["picture_path_list"].values.tolist()
            rl = group["rank_list"].values.tolist()
            xy_list = group["feature_tsne_result"].values.tolist()
            xy_list = pandas.DataFrame(xy_list)
            xy_mean = xy_list.mean()
            # {["path_list"], "bianchang", "center","rank_list"}
            cluster.append([path_list, math.ceil(math.sqrt(len(path_list))), [xy_mean[0], xy_mean[1]], rl])
            center.append([xy_mean[0], xy_mean[1]])
            bian.append(math.ceil(math.sqrt(len(path_list))))
            for index, row in group.iterrows():
                ci_list[index] = cluster_index
            cluster_index = cluster_index + 1

    dict["cluster"] = cluster
    dict["center"] = center
    dict["bian"] = bian
    dict["ci_list"] = ci_list

    with open("static/data/Display/" + path_name[0:19] + "_display.json", 'w', encoding='utf-8') as file:
        file.write(json.dumps(dict, indent=2, ensure_ascii=False))

    with open("static/data/Display/" + path_name[0:19] + "_feature_list.json", 'w', encoding='utf-8') as file:
        file.write(json.dumps(dict0, indent=2, ensure_ascii=False))


def overview_update(request):
    path_name = request.POST.get("pid", None)
    result = request.POST.get("new_result", None)
    # pre_result = request.POST.get("pre_result", None)
    dict = request.POST.get("dict", None)
    path_name = eval(path_name)
    # pre_result = eval(pre_result)
    result = eval(result)
    dict = eval(dict)
    print(path_name)
    print(result)
    # print(pre_result)
    print(dict)
    path_name = path_name + ".jpg"

    # 展示前N个
    N = 500

    # 选择进行降维的特征
    # F = 0  # model feature
    # F = 1  # attributes
    # F = 2  # fusion
    F = 0

    compression_data = pandas.read_json("static\data\compression_data.json")
    compression_data_query = pandas.read_json("static\data\compression_data_query.json")
    query_color = compression_data_query[path_name]
    # 获取qg
    query = pandas.read_json("static\data\data_delete0000\query.json")
    aimqg = query.loc[query['path_name'] == path_name]["newqg"].tolist()
    aimqg = aimqg[0]
    gallery = pandas.read_json("static\data\data_delete0000\gallery.json")

    dict = {}
    path_name_list = []
    feature_list = []
    attribute_list = []
    fusion_list = []
    rank_list = []
    dis_fangcha = []

    for i in range(0, N):
        # "gallery_feature"
        feature_list.append(gallery.loc[gallery["id"] == aimqg[result[i]]]["gallery_feature"].tolist()[0])
        # "gallery_attributes"
        attribute_list.append(gallery.loc[gallery["id"] == aimqg[result[i]]]["gallery_attributes"].tolist()[0])
        # "gallery_attributes"
        fusion_list.append(gallery.loc[gallery["id"] == aimqg[result[i]]]["gallery_feature"].tolist()[0] +
                           gallery.loc[gallery["id"] == aimqg[result[i]]]["gallery_attributes"].tolist()[0])
        # "path_name"
        path_name_list.append("http://127.0.0.1:8000/static/data/image/bounding_box_test/" +
                              gallery.loc[gallery["id"] == aimqg[result[i]]]["path_name"].iloc[0])
        # "rank"
        rank_list.append(i)
        # 颜色方差
        p = gallery.loc[gallery["id"] == aimqg[i]]["path_name"].iloc[0]
        p_color = compression_data[p]
        dis_fangcha.append(PixelBar.dis_fc(query_color, p_color))

    # 对模型特征进行归一化
    feature_list = np.array(feature_list)
    feature_list_normed = feature_list / feature_list.max(axis=0)

    # 对属性特征进行归一化
    attribute_list = np.array(attribute_list)
    attribute_list_normed = attribute_list / attribute_list.max(axis=0)

    # 对混合特征进行归一化
    fusion_list = np.array(fusion_list)
    fusion_list_normed = fusion_list / fusion_list.max(axis=0)

    # 选择要进行降维的特征
    if F == 0:
        F_list_normed = feature_list
    if F == 1:
        F_list_normed = attribute_list
    if F == 2:
        F_list_normed = fusion_list

    layout_dict={}
    print("之后：F_list_normed")
    print(F_list_normed.tolist())
    # T-sne得到二维投影
    X = np.array(F_list_normed)
    # tsne = TSNE(n_components=2)
    tsne = TSNE(n_components=2,init="pca",random_state=None)
    F_tsne_result = tsne.fit_transform(X)
    F_tsne_result = F_tsne_result.tolist()
    print("之后的tsne结果：")
    print(F_tsne_result)
    # layout_dict["F_list_normed"]=F_list_normed.tolist()
    # layout_dict["F_tsne_result"]=F_tsne_result
    # with open("static/data/layout_dict_second.json", 'w', encoding='utf-8') as file:
    #     file.write(json.dumps(layout_dict, indent=2, ensure_ascii=False))

    print("DBCSAN聚类")
    # 使用DBCSAN聚类获得每一个样本的label
    db = DBSCAN(eps=1.6, min_samples=2).fit(F_tsne_result)
    core_samples_mask = np.zeros_like(db.labels_, dtype=bool)
    core_samples_mask[db.core_sample_indices_] = True
    labels = db.labels_
    labels = labels.tolist()
    print("labels")
    print(labels)

    # 获取true_list
    picture_true_list = query.loc[query['path_name'] == path_name]["true_list"].tolist()
    picture_true_list = picture_true_list[0]

    # aimqg:["query","picture_true_list","picture_path_list","feature_tsne_result","rank_list","lables"]
    dict["query"] = "http://127.0.0.1:8000/static/data/image/query/" + path_name
    dict["picture_true_list"] = picture_true_list[0:N]
    dict["picture_path_list"] = path_name_list
    dict["feature_tsne_result"] = F_tsne_result
    dict["rank_list"] = rank_list
    dict["lables"] = labels
    dict["dis_fangcha"] = dis_fangcha

    # ['query','picture_true_list','picture_path_list','feature_tsne_result','rank_list','lables']
    dict_dataframe = pandas.DataFrame(dict)


    """
    -----------------------------------------------------------------------------------------------------------------------------------------------------------------------
    grid布局数据["cluster":[["path_list"], "bianchang", "center",["rank_list"]],"center":[],"bian":[]]
    -----------------------------------------------------------------------------------------------------------------------------------------------------------------------
    """

    dict_dataframe = dict_dataframe.groupby('lables')
    cluster = []
    center = []
    bian = []
    cluster_index = 0
    ci_list = {}

    for name, group in dict_dataframe:
        # print(group)
        # print(group.columns.values)
        if (name == -1):
            for index, row in group.iterrows():
                # print("row")
                # print(row)
                # {["path_list"], "bianchang", "center",["rank_list"]}
                cluster.append([[row["picture_path_list"]], 1, row["feature_tsne_result"], [row["rank_list"]]])
                ci_list[index] = cluster_index
                cluster_index = cluster_index + 1
                center.append(row["feature_tsne_result"])
                bian.append(1)
        else:
            path_list = group["picture_path_list"].values.tolist()
            rl = group["rank_list"].values.tolist()
            xy_list = group["feature_tsne_result"].values.tolist()
            xy_list = pandas.DataFrame(xy_list)
            xy_mean = xy_list.mean()
            # {["path_list"], "bianchang", "center","rank_list"}
            cluster.append([path_list, math.ceil(math.sqrt(len(path_list))), [xy_mean[0], xy_mean[1]], rl])
            center.append([xy_mean[0], xy_mean[1]])
            bian.append(math.ceil(math.sqrt(len(path_list))))
            for index, row in group.iterrows():
                ci_list[index] = cluster_index
            cluster_index = cluster_index + 1

    dict["cluster"] = cluster
    dict["center"] = center
    dict["bian"] = bian
    dict["ci_list"] = ci_list

    print(dict)
    return JsonResponse(json.dumps(dict, ensure_ascii=False), safe=False)





