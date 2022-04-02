from django.shortcuts import render
import base64
from django.http import JsonResponse
import pandas as pd
import numpy as np
import math
from sklearn.manifold import TSNE
from sklearn.cluster import DBSCAN
import pymysql
import numpy as np
from scipy.optimize import minimize
from scipy.spatial.distance import cdist
from sklearn.neighbors import kneighbors_graph
from scipy import sparse
import json
import pandas
import numpy


# Create your views here.
# 必须加参数；一般都用request【是请求信息对象】;HttpResponse【是响应信息对象】
def Hello(request):
    # 返回一个字符串
    # return  HttpResponse("<h1>welcome python zhangyu</h1>")
    # 返回页面;第一次参数是request；第二个参数是在templates目录下的文件；不需要导入；直接写就可以
    return render(request, "index.html")


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


class LapSVM(object):
    def __init__(self, opt):
        self.opt = opt

    def fit(self, X, Y, X_u):
        # construct graph
        self.X = np.vstack([X, X_u])
        Y = np.diag(Y)
        # print(Y)
        if self.opt['neighbor_mode'] == 'connectivity':
            W = kneighbors_graph(self.X, self.opt['n_neighbor'], mode='connectivity', include_self=False)
            W = (((W + W.T) > 0) * 1)
        elif self.opt['neighbor_mode'] == 'distance':
            W = kneighbors_graph(self.X, self.opt['n_neighbor'], mode='distance', include_self=False)
            W = W.maximum(W.T)
            W = sparse.csr_matrix((np.exp(-W.data ** 2 / 4 / self.opt['t']), W.indices, W.indptr),
                                  shape=(self.X.shape[0], self.X.shape[0]))
        else:
            raise Exception()

        # Computing Graph Laplacian
        L = sparse.diags(np.array(W.sum(0))[0]).tocsr() - W

        # Computing K with k(i,j) = kernel(i, j)
        K = self.opt['kernel_function'](self.X, self.X, **self.opt['kernel_parameters'])

        l = X.shape[0]
        u = X_u.shape[0]
        # Creating matrix J [I (l x l), 0 (l x (l+u))]
        J = np.concatenate([np.identity(l), np.zeros(l * u).reshape(l, u)], axis=1)

        # Computing "almost" alpha
        almost_alpha = np.linalg.inv(2 * self.opt['gamma_A'] * np.identity(l + u) \
                                     + ((2 * self.opt['gamma_I']) / (l + u) ** 2) * L.dot(K)).dot(J.T).dot(Y)

        # Computing Q
        Q = Y.dot(J).dot(K).dot(almost_alpha)

        Q = (Q + Q.T) / 2

        del W, L, K, J

        e = np.ones(l)
        q = -e

        # ===== Objectives =====
        def objective_func(beta):
            return (1 / 2) * beta.dot(Q).dot(beta) + q.dot(beta)

        def objective_grad(beta):
            return np.squeeze(np.array(beta.T.dot(Q) + q))

        # =====Constraint(1)=====
        #   0 <= beta_i <= 1 / l
        bounds = [(0, 1 / l) for _ in range(l)]

        # =====Constraint(2)=====
        #  Y.dot(beta) = 0
        def constraint_func(beta):
            return beta.dot(np.diag(Y))

        def constraint_grad(beta):
            return np.diag(Y)

        cons = {'type': 'eq', 'fun': constraint_func, 'jac': constraint_grad}

        # ===== Solving =====
        x0 = np.zeros(l)

        beta_hat = minimize(objective_func, x0, jac=objective_grad, constraints=cons, bounds=bounds)['x']

        # Computing final alpha
        self.alpha = almost_alpha.dot(beta_hat)

        del almost_alpha, Q

        # Finding optimal decision boundary b using labeled data
        new_K = self.opt['kernel_function'](self.X, X, **self.opt['kernel_parameters'])
        f = np.squeeze(np.array(self.alpha)).dot(new_K)

        self.sv_ind = np.nonzero((beta_hat > 1e-15) * (beta_hat < (1 / l - 1e-15)))[0]

        ind = self.sv_ind[0]
        self.b = np.diag(Y)[ind] - f[ind]

    def decision_function(self, X, l_index):
        new_K = self.opt['kernel_function'](self.X, X, **self.opt['kernel_parameters'])
        f = np.squeeze(np.array(self.alpha)).dot(new_K)

        return f + self.b


def rbf(X1, X2, **kwargs):
    return np.exp(-cdist(X1, X2) ** 2 * kwargs['gamma'])


def LapSVM_rerank(pid, dict):
    l_index = dict["l_index"]
    Yl = dict["Yl"]
    print(l_index)
    print(Yl)

    # X代表样本特征，Y代表人工反馈的标签
    print("static\data\Display\\" + pid + "_feature_list.json")
    reid_data = pandas.read_json("static\data\Display\\" + pid + "_feature_list.json")
    print(reid_data)
    X = numpy.array(reid_data["feature_list"].tolist())
    N_index = []
    for i in range(0, len(X)):
        N_index.append(i)
    # l_index = [0, 1, 2, 5]
    # Yl = [1, 1, -1, -1]
    Xl = np.vstack([X[l_index, :]])
    u_index = np.setdiff1d(N_index, l_index)
    Xu = np.vstack([X[u_index, :]])
    opt = {'neighbor_mode': 'connectivity',
           'n_neighbor': 5,
           't': 1,
           'kernel_function': rbf,
           'kernel_parameters': {'gamma': 10},
           'gamma_A': 0.03125,
           'gamma_I': 10000}

    s = LapSVM(opt)
    s.fit(Xl, Yl, Xu)

    Y_ = s.decision_function(X, l_index)

    reid_data["rank"] = Y_

    result = np.argsort(-Y_)
    print("反馈信息----------------------------------------------------！！！！！！！")
    print(result.tolist())

    dict = {}
    dict["result"] = result.tolist()
    dict["similarity"] = Y_.tolist()
    return dict


def graph_propagation(request):
    if request.method == "POST":
        dict = request.POST.get("dict", None)
        pid = request.POST.get("pid", None)
        print("dict&pid---------------------------------------------------------")
        dict = eval(dict)
        pid = eval(pid)
        print(dict)
        print(pid)

        dict = LapSVM_rerank(pid, dict)
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
fusion_optimize
-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
"""

def graph_propagation_optimize(request):
    if request.method == "POST":
        dict = request.POST.get("dict", None)
        pid = request.POST.get("pid", None)
        print("dict&pid---------------------------------------------------------")
        dict = eval(dict)
        pid = eval(pid)
        print(dict)
        print(pid)
        N = 20

        # dict = {'l_index': [0, 1, 2, 5], 'Yl': [0.1, 0.1, -1, -1]}
        # pid = "1239_c2s3_012107_00"
        # 所有反馈的输出
        # dict = LapSVM_rerank(pid, dict)

        # 正样本index提取
        l_index = dict["l_index"]
        Yl = dict["Yl"]
        # feedback index
        rerank_meta = {}
        # feedback value
        rerank_meta_ = {}
        positive_idx = []
        positive = []
        nagetive_idx = []
        nagetive = []
        # 遍历每一个正样本反馈
        for i in range(0, len(Yl)):
            if (Yl[i] > 0):
                positive_idx.append(l_index[i])
                positive.append(Yl[i])
            if (Yl[i] < 0):
                nagetive_idx.append(l_index[i])
                nagetive.append(Yl[i])
        for i in range(0, len(positive_idx)):
            meta = [positive_idx[i]] + nagetive_idx
            meta_ = [positive[i]] + nagetive
            rerank_meta[positive_idx[i]] = meta
            rerank_meta_[positive_idx[i]] = meta_
        rerank_meta_all = {}
        for key in rerank_meta:
            meta_all = {}
            meta_all["l_index"] = rerank_meta[key]
            meta_all["Yl"] = rerank_meta_[key]
            rerank_meta_all[key] = meta_all
        # print(rerank_meta_all)

        # 单个正反馈样本得到的图传播结果
        rerank = {}
        # 单个正反馈样本得到的图传播结果的相似度
        rerank_similarity = {}
        # 单个正反馈样本得到的图传播结果和初始结果的 kendall_tau_distance
        # rerank_kendall_tau_distance = {}

        for key in rerank_meta_all:
            rank = LapSVM_rerank(pid, rerank_meta_all[key])
            rerank[key] = rank["result"]
            # rerank_similarity[key] = rank["similarity"]
            # 归一化相似度
            similarity_norm = np.array(rank["similarity"])
            similarity_norm = (similarity_norm - similarity_norm.min(axis=0)) / (
                    similarity_norm.max(axis=0) - similarity_norm.min(axis=0))
            rerank_similarity[key] = similarity_norm.tolist()

            # 生成一个和燃控长度相同的initial rank list
            initial_rank_list = []
            for i in range(0, len(rank["result"])):
                initial_rank_list.append(i)
            # print(initial_rank_list)

            # 计算kentau距离
            # kt_distance = kendall_tau_distance(initial_rank_list, rank["result"])
            # rerank_kendall_tau_distance[key] = kt_distance[0]
            print("finish:" + str(key))
        print(rerank)
        print(rerank_similarity)
        # print(rerank_kendall_tau_distance)

        # 所有rank的前20个样本-交集
        # rerank_N = {}
        # for key in rerank:
        #     rerank_N[key] = set(rerank[key][0:N])

        # # 并集
        # union_set = set()
        # for key in rerank_N:
        #     print(rerank_N[key])
        #     union_set = union_set | rerank_N[key]
        # # print(union_set)
        # print("finish:union_set")

        # # 交集
        # intersection_set = set()
        # for key in rerank_N:
        #     print(rerank_N[key])
        #     intersection_set = intersection_set & rerank_N[key]
        # # print(intersection_set)
        # print("finish:intersection_set")
        #
        # # union_set - intersection_set
        # checking_set = union_set - intersection_set
        # checking_list = list(checking_set)

        # 所有反馈的输出
        rerank_all = LapSVM_rerank(pid, dict)
        s_initial = rerank_all["similarity"]
        # 归一化
        s_initial = np.array(rerank_all["similarity"])
        s_initial = (s_initial - s_initial.min(axis=0)) / (
                s_initial.max(axis=0) - s_initial.min(axis=0))
        s_initial = s_initial.tolist()

        r_initial = rerank_all["result"]
        # print(s_initial)
        print("旧的排序")
        print(r_initial)
        # s_final=s_initial
        # for key in rerank_N:
        #     for i in range(0,len(rerank_N[key])):

        for key1 in rerank:
            print(rerank[key1])
            r = rerank[key1]
            for k in range(0, N):
                for key2 in rerank:
                    rk = rerank[key2].index(r[k])
                    if rk - k > 300:
                        s_initial[r[k]] = rerank_similarity[key1][r[k]]
        print("新的s_initial")
        print(s_initial)
        print("新的排序")
        s_initial_np = np.array(s_initial)
        new_rank_result = np.argsort(-s_initial_np)
        print(new_rank_result.tolist())

        # return rerank_final
        new_dict={}
        new_dict["result"]=new_rank_result.tolist()

        return JsonResponse(json.dumps(new_dict, ensure_ascii=False), safe=False)

# 放弃研究：多目标SVM
def graph_propagation_multi_SVM(request):
    if request.method == "POST":
        dict = request.POST.get("dict", None)
        pid = request.POST.get("pid", None)
        print("dict&pid---------------------------------------------------------")
        dict = eval(dict)
        pid = eval(pid)
        print(dict)
        print(pid)

        dict = LapSVM_rerank(pid, dict)
        # 遍历每一个

        return JsonResponse(json.dumps(dict, ensure_ascii=False), safe=False)


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
# Converts RGB pixel array to XYZ format.
# Implementation derived from http://www.easyrgb.com/en/math.php
def rgb2xyz(rgb):
    def format(c):
        c = c / 255.
        if c > 0.04045: c = ((c + 0.055) / 1.055) ** 2.4
        else: c = c / 12.92
        return c * 100
    rgb = list(map(format, rgb))
    xyz = [None, None, None]
    xyz[0] = rgb[0] * 0.4124 + rgb[1] * 0.3576 + rgb[2] * 0.1805
    xyz[1] = rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722
    xyz[2] = rgb[0] * 0.0193 + rgb[1] * 0.1192 + rgb[2] * 0.9505
    return xyz

# Converts XYZ pixel array to LAB format.
# Implementation derived from http://www.easyrgb.com/en/math.php
def xyz2lab(xyz):
    def format(c):
        if c > 0.008856: c = c ** (1. / 3.)
        else: c = (7.787 * c) + (16. / 116.)
        return c
    xyz[0] = xyz[0] / 95.047
    xyz[1] = xyz[1] / 100.00
    xyz[2] = xyz[2] / 108.883
    xyz = list(map(format, xyz))
    lab = [None, None, None]
    lab[0] = (116. * xyz[1]) - 16.
    lab[1] = 500. * (xyz[0] - xyz[1])
    lab[2] = 200. * (xyz[1] - xyz[2])
    return lab

# Converts RGB pixel array into LAB format.
def rgb2lab(rgb):
    return xyz2lab(rgb2xyz(rgb))

def ciede2000(lab1, lab2):
    L1 = lab1[0]
    A1 = lab1[1]
    B1 = lab1[2]
    L2 = lab2[0]
    A2 = lab2[1]
    B2 = lab2[2]
    C1 = np.sqrt((A1 ** 2.) + (B1 ** 2.))
    C2 = np.sqrt((A2 ** 2.) + (B2 ** 2.))
    aC1C2 = np.average([C1, C2])
    G = 0.5 * (1. - np.sqrt((aC1C2 ** 7.) / ((aC1C2 ** 7.) + (25. ** 7.))))
    a1P = (1. + G) * A1
    a2P = (1. + G) * A2
    c1P = np.sqrt((a1P ** 2.) + (B1 ** 2.))
    c2P = np.sqrt((a2P ** 2.) + (B2 ** 2.))
    if a1P == 0 and B1 == 0: h1P = 0
    else:
        if B1 >= 0: h1P = np.degrees(np.arctan2(B1, a1P))
        else: h1P = np.degrees(np.arctan2(B1, a1P)) + 360.
    if a2P == 0 and B2 == 0: h2P = 0
    else:
        if B2 >= 0: h2P = np.degrees(np.arctan2(B2, a2P))
        else: h2P = np.degrees(np.arctan2(B2, a2P)) + 360.
    dLP = L2 - L1
    dCP = c2P - c1P
    if h2P - h1P > 180: dhC = 1
    elif h2P - h1P < -180: dhC = 2
    else: dhC = 0
    if dhC == 0: dhP = h2P - h1P
    elif dhC == 1: dhP = h2P - h1P - 360.
    else: dhP = h2P + 360 - h1P
    dHP = 2. * np.sqrt(c1P * c2P) * np.sin(np.radians(dhP / 2.))
    aL = np.average([L1, L2])
    aCP = np.average([c1P, c2P])
    if c1P * c2P == 0: haC = 3
    elif np.absolute(h2P - h1P) <= 180: haC = 0
    elif h2P + h1P < 360: haC = 1
    else: haC = 2
    haP = np.average([h1P, h2P])
    if haC == 3: aHP = h1P + h2P
    elif haC == 0: aHP = haP
    elif haC == 1: aHP = haP + 180
    else: aHP = haP - 180
    lPa50 = (aL - 50) ** 2.
    sL = 1. + (0.015 * lPa50 / np.sqrt(20. + lPa50))
    sC = 1. + 0.045 * aCP
    T = 1. - 0.17 * np.cos(np.radians(aHP - 30.)) + 0.24 * np.cos(np.radians(2. * aHP)) + 0.32 * np.cos(np.radians(3. * aHP + 6.)) - 0.2 * np.cos(np.radians(4. * aHP - 63.))
    sH = 1. + 0.015 * aCP * T
    dTheta = 30. * np.exp(-1. * ((aHP - 275.) / 25.) ** 2.)
    rC = 2. * np.sqrt((aCP ** 7.) / ((aCP ** 7.) + (25. ** 7.)))
    rC = 2. * np.sqrt(aCP ** 7. / (aCP ** 7. + 25. ** 7.))
    rT = -np.sin(np.radians(2. * dTheta)) * rC
    fL = dLP / sL / 1.
    fC = dCP / sC / 1.
    fH = dHP / sH / 1.
    dE2000 = np.sqrt(fL ** 2. + fC ** 2. + fH ** 2. + rT * fC * fH)
    return dE2000

def Euclidean_Distance(f1, f2):
    sum = 0
    for i in range(0, len(f1)):
        sum = sum + (f1[i] - f2[i]) * (f1[i] - f2[i])
    dis = math.sqrt(sum)
    return dis
def dis_fc(c1,c2):
    length=len(c1)
    dis_list=[]
    # print(length)
    for i in range(0,length):
        lab1=rgb2lab(c1[i])
        lab2=rgb2lab(c2[i])
        dis = ciede2000(lab1, lab2)
        dis_list.append(dis)
    # print(dis_list)
    # 求方差
    dis_list=np.array(dis_list)
    fangcha=np.var(dis_list)
    # print(fangcha)
    return fangcha
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
        dis_fangcha.append(dis_fc(query_color, p_color))

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
        dis_fangcha.append(dis_fc(query_color, p_color))

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


# 弃用
def getAim(request):
    pid = request.POST.get("pid", None)
    # pid = str(pid)
    print("pid")
    print(pid)
    feature_tsne_result = search_feature_tsne_list_new(pid[1:-1])
    picture_path_list = search_picture_list(pid[1:-1])
    picture_true_list = search_true_list(pid[1:-1])
    dict = {}
    dict["feature_tsne_result"] = feature_tsne_result.tolist()
    # picture_path_list.insert(0,pid[1:-1])
    dict["picture_path_list"] = picture_path_list
    dict["query"] = pid[1:-1]
    # picture_true_list.insert(0,"1")
    dict["picture_true_list"] = picture_true_list
    print(dict)
    with open('static\data\ForQueryFilter\display_tsne_result.json', 'w', encoding='utf-8') as file:
        file.write(json.dumps(dict, indent=2, ensure_ascii=False))
    return JsonResponse(json.dumps(dict, ensure_ascii=False), safe=False)


"""
-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
针对index.html出发的一些函数
这里输入的pid都是一个地址(如："http://127.0.0.1:8000/static/data/image/query/0003_c4s6_015641_00.jpg")
-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
"""


# 弃用
def search_picture_list(pid):
    with open('static\data\ForQueryFilter\QGpath_true3368.json', "r", newline='',
              encoding='utf-8') as file:
        qg = json.load(file)
    print("finish:read picture")

    return qg["dict_path"][pid]


# 弃用
def search_true_list(pid):
    with open('static\data\ForQueryFilter\QGpath_true3368.json', "r", newline='',
              encoding='utf-8') as file:
        qg = json.load(file)
    print("finish:read true")

    return qg["dict_true"][pid]


# 弃用
def search_feature_tsne_list_new(pid):
    id = pid[45:]
    print(id)
    with open('static\data\ForQueryFilter\QGpath_true3368.json', "r", newline='',
              encoding='utf-8') as file:
        QGpath_true = json.load(file)
    print("finish:read QGpath_true3368")

    # with open('static\data\\featureData\market1501_QGMatrix_resnet50_512fc.json', "r", newline='',
    with open('static\data\\clustercontrast\dictQGindex.json', "r", newline='',
              encoding='utf-8') as file:
        qg = json.load(file)
    qg = pd.DataFrame(qg)
    print(qg)
    print("finish:read QGmatrix")

    id = QGpath_true["dict_pid_index"][id][5:]
    id_list = qg.iloc[int(id)][0]
    print(id_list)
    with open('static\data\\clustercontrast\dictgallery_feature.json', "r", newline='',
              encoding='utf-8') as file:
        gallery_data = json.load(file)
    gallery = pd.DataFrame(gallery_data)
    print(gallery)
    print("finish:read gallery")

    feature_list = []
    rank_list_change = []
    # for i in range(0, len(id_list)):
    for i in range(0, 500):
        print(id_list[i])
        feature_list.append(gallery.iloc[int(id_list[i])][0])
    print(feature_list)
    # for i in range(0,len(feature_list)):
    #     dis=cal_distance(feature_list[0],feature_list[i])
    #     rank_list_change.append(dis)
    #     print("dis"+str(i)+":"+str(dis))

    X = np.array(feature_list)
    tsne = TSNE(n_components=2)
    result = tsne.fit_transform(X)
    return result


# 弃用
def cal_distance(f1, f2):
    sum = 0
    for i in range(0, len(f1)):
        sum = sum + (f1[i] - f2[i]) * (f1[i] - f2[i])
    dis = math.sqrt(sum)
    return dis


# 弃用
def search_feature_tsne_list(pid):
    id = pid[45:]
    print(id)
    with open('static\data\ForQueryFilter\QGpath_true3368.json', "r", newline='',
              encoding='utf-8') as file:
        QGpath_true = json.load(file)
    print("finish:read QGpath_true3368")

    with open('static\data\\clustercontrast\dictQGindex.json', "r", newline='',
              encoding='utf-8') as file:
        qg = json.load(file)
    qg = pd.DataFrame(qg)
    print(qg)
    print("finish:read QGmatrix")
    print(QGpath_true["dict_pid_index"][id])
    id = QGpath_true["dict_pid_index"][id][5:]
    id_list = qg.iloc[int(id)][0]

    with open('static\data\\clustercontrast\dictgallery_feature.json', "r", newline='',
              encoding='utf-8') as file:
        gallery_data = json.load(file)
    gallery = pd.DataFrame(gallery_data)
    print(gallery)
    print("finish:read gallery")
    feature_list = []

    with open('static\data\\clustercontrast\dictquery_feature.json', "r", newline='',
              encoding='utf-8') as file:
        query_data = json.load(file)
    query = pd.DataFrame(query_data)
    print(query)
    print("finish:read query")
    feature_list.append(query.iloc[int(id)][0])

    for i in range(0, len(id_list)):
        # for i in range(0, 10):
        # print(id_list[i])
        # print(gallery.iloc[int(id_list[i])][0])
        feature_list.append(gallery.iloc[int(id_list[i])][0])

    X = np.array(feature_list)
    tsne = TSNE(n_components=2)
    result = tsne.fit_transform(X)
    return result


"""
-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
弃用的函数(tsne)
-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
"""


# 弃用
def get_model_features(request):
    if request.method == "POST":
        features = request.POST.get("features", None)
        print(features)
        features = json.loads(features)
        print(features)
        data = []
        for key in features.keys():
            data.append(features[key])
        print(data)
        X = np.array(data)
        tsne = TSNE(n_components=2)
        result = tsne.fit_transform(X)
        print(result)
        jsondata = {}
        jsondata["features"] = result.tolist()
        return JsonResponse(json.dumps(jsondata, ensure_ascii=False), safe=False)


# 弃用
def getOnePicture_for_query(request):
    pid_index = request.POST.get("pid_index", None)
    pid_index = int(pid_index)

    # 获取query信息['impath', 'feature', 'pids', 'camids']
    with open('static\data\\featureData\query_market1501_3368_resnet50_512fc.json', "r", newline='',
              encoding='utf-8') as file:
        query_data = json.load(file)
    query = json.loads(query_data)
    query = pd.DataFrame(query)

    # 获取gallery信息['impath', 'feature', 'pids', 'camids']
    with open('static\data\\featureData\gallery_market1501_15913_resnet50_512fc.json', "r", newline='',
              encoding='utf-8') as file:
        gallery_data = json.load(file)
    gallery = json.loads(gallery_data)
    gallery = pd.DataFrame(gallery)

    # 设置想要询问的pid下标
    # pid_index = 3053

    # 获取询问图片文件名并转为base64格式
    impath = query.iloc[pid_index][0]
    name = impath[54:]
    path = "static\data\image\query" + name
    with open(path, 'rb') as f:
        base64_data = base64.b64encode(f.read())
        query_data = base64_data.decode()

    # 获取QG信息
    with open('static\data\\featureData\market1501_QGMatrix_resnet50_512fc.json', "r", newline='',
              encoding='utf-8') as file:
        qg = json.load(file)
    qg = pd.DataFrame(qg)
    rank_index_list = qg.iloc[pid_index][0]
    rank_data_list = []
    for i in range(0, 10):
        gallery_index = rank_index_list[i]
        impath = gallery.iloc[gallery_index][0]
        name = impath[66:]
        path = "static\data\image\\bounding_box_test" + name
        with open(path, 'rb') as f:
            base64_data = base64.b64encode(f.read())
            g_data = base64_data.decode()
            rank_data_list.append(g_data)

    dict = {}
    dict["query_data"] = query_data
    dict["rank_data_list"] = rank_data_list
    return JsonResponse(json.dumps(dict, ensure_ascii=False), safe=False)


# 弃用
def readPoint():  # 读取降维结果
    with open('static\data\query_tsne.json', "r", newline='', encoding='utf-8') as file:
        json_data = json.load(file)
        return json_data
