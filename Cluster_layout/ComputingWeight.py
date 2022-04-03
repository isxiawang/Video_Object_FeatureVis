import json
from collections import Counter
from typing import List

import numpy as np
from numpyencoder import NumpyEncoder
from scipy.optimize import minimize

from sklearn.cluster import DBSCAN
from sklearn.manifold import TSNE


def computing_weight(data: List[List], eps, min_samples, ignore=False):
    if ignore:
        return [1 for _ in range(len(data))]
    clustering = DBSCAN(eps=eps, min_samples=min_samples).fit(np.array(data))
    label = clustering.labels_
    weight = [np.sum(label == label[i]) for i in range(len(label))]
    print('类别为：', Counter(weight))
    return weight


def computing_distance(vec1, vec2):
    vec1 = np.array(vec1)
    vec2 = np.array(vec2)
    return np.linalg.norm(vec1 - vec2)


def kernel(vec1, vec2, sigma=1.0):
    return np.exp(-np.linalg.norm(vec1 - vec2) ** 2 / (2 * sigma ** 2))


def computing_pij(mat):
    p = np.zeros(shape=(mat.shape[0], mat.shape[0]))
    for i in range(mat.shape[0]):
        sig = np.std(mat[i, :])
        s = 0
        for j in range(mat.shape[0]):
            if j == i:
                continue
            s += kernel(mat[i, :], mat[j, :], float(sig))
        for j in range(mat.shape[0]):
            p[i, j] = kernel(mat[i, :], mat[j, :], float(sig)) / s
    p1 = np.zeros(shape=p.shape)
    n = p.shape[0]
    for i in range(p1.shape[0]):
        for j in range(p1.shape[1]):
            p1[i, j] = (p[i, j] + p[j, i]) / (2 * n)
    return p1


def split_new_set(l1, l2):
    sl1 = set(l1)
    nl = [1 if l2[i] in sl1 else 0 for i in range(len(l2))]
    return nl


def obj_func1(x):
    s = 0
    n = pij_mat.shape[0]
    temp = 0
    for i in range(n):
        for j in range(n):
            if i == j:
                continue
            # print(type(x[i]), x[i], len(x))
            temp += 1 / (1 + computing_distance([x[i], x[i + 500]], [x[j], x[j + 500]]))
    for i in range(n):
        for j in range(n):
            if i == j:
                continue
            s += pij_mat[i, j] * np.log(
                pij_mat[i, j] * (1 + computing_distance([x[i], x[i + 500]], [x[j], x[j + 500]])) / temp)
    return s


def obj_func2(x):
    ans = 0
    for p in id_old:
        ans += computing_distance([x[id2index_current[p]], x[id2index_current[p] + 500]],
                                  p_data['initial_tsne'][id2index_pre[p]])
    return ans


def obj_func3(x):
    ans = 0
    for pn in id_new:
        for po in id_old:
            if (pn, po) in dis_feature:
                ans += np.fabs(
                    dis_feature[(pn, po)] - computing_distance([x[id2index_current[pn]], x[id2index_current[pn] + 500]],
                                                               [x[id2index_current[po]],
                                                                x[id2index_current[po] + 500]]))
    return ans


def obj_func(x):
    return w[0] * obj_func1(x) + w[1] * obj_func2(x) + w[2] * obj_func3(x)


def compute_derivative(x: np.ndarray):
    # 先算func1
    grad1 = np.zeros(shape=x.shape)
    temp_z = 0
    for i in range(x.shape[0]):
        for j in range(x.shape[0]):
            if i != j:
                temp_z += 1 / (1 + computing_distance(x[i, :], x[j, :]) ** 2)
    if temp_z == 0:
        temp_z = 0.00001
    for i in range(x.shape[0]):
        temp = np.zeros(shape=grad1[i, :].shape)
        for j in range(x.shape[0]):
            temp_qij = 1 / (1 + computing_distance(x[i, :], x[j, :]) ** 2) / temp_z
            temp += (pij_mat[i, j] - temp_qij) * (x[i, :] - x[j, :]) / (1 + computing_distance(x[i, :], x[j, :]) ** 2)
        grad1[i, :] = 4 * temp
    # 计算func2
    grad2 = np.zeros(shape=x.shape)
    for i in range(x.shape[0]):
        if index2id_current[i] in id_old:
            grad2[i, :] = 2 * (x[i, :] - old_position[id2index_pre[index2id_current[i]], :])
    # 计算func3
    grad3 = np.zeros(shape=x.shape)
    for i in range(x.shape[0]):
        temp_d = 0
        if index2id_current[i] in id_new:
            # 新的点
            for j in id_old:
                temp_d += -4 * (dis_feature[(index2id_current[i], j)] ** 2 -
                                computing_distance(x[i, :], x[id2index_current[j], :]) ** 2) * (
                                  x[i, :] - x[id2index_current[j], :])
        else:
            # 旧的点
            for j in id_new:
                temp_d += -4 * (dis_feature[(j, index2id_current[i])] ** 2 -
                                computing_distance(x[i, :], x[id2index_current[j], :]) ** 2) * (
                                  x[i, :] - x[id2index_current[j], :])
        grad3[i, :] += temp_d
    grad3 /= (len(id_old) * len(id_new))
    return w[0] * grad1 + w[1] * grad2 + w[2] * grad3


def minimize_momentum(x, eta, gamma, max_iter=10):
    v = np.zeros(shape=x.shape)
    i = 0
    ans = x.copy()
    while i < max_iter:
        print("This is", i, "iteration")
        grad = compute_derivative(x)
        v = gamma * v + eta * grad
        ans -= v
        i += 1
    return ans


def transform_x(x):
    max_x = np.max(x)
    min_x = np.min(x)
    if max_x - min_x < 0.001:
        return 2 * x / 0.001 - (max_x + min_x) / 0.001
    else:
        return 2 * x / (max_x - min_x) - (max_x + min_x) / (max_x - min_x)


with open('layout.json') as f:
    data = json.loads(f.read())
c_data = data['current']
p_data = data['pre']
current_feature = c_data['feature']
id2index_current = {c_data['id'][i]: i for i in range(len(c_data['id'][:500]))}
id2index_pre = {p_data['id'][i]: i for i in range(len(p_data['id']))}
id_current = set(c_data['id'][:500])
id_pre = set(p_data['id'])
id_old = id_current.intersection(id_pre)
id_new = id_current.difference(id_pre)
old_position = np.array(p_data['initial_tsne'])
index2id_current = {v: k for k, v in id2index_current.items()}
index2id_pre = {v: k for k, v in id2index_pre.items()}
# pij_mat = computing_pij(np.array(current_feature))
# dis_feature = {}
# for i in id_old:
#     for j in id_new:
#         if (i, j) not in dis_feature:
#             dist = computing_distance(current_feature[id2index_current[i]], current_feature[id2index_current[j]])
#             dis_feature[str((i, j))] = dist
#             dis_feature[str((j, i))] = dist
# with open('constant.json', 'w', encoding='utf-8') as f:
#     json.dump({'pij_mat': pij_mat, 'dis_feature': dis_feature}, f, indent=4, ensure_ascii=False, cls=NumpyEncoder)
with open('constant.json', 'r') as f:
    json_data = json.loads(f.read())
pij_mat = np.array(json_data['pij_mat'])
dis_feature = {}
for k, v in json_data['dis_feature'].items():
    nk1 = (int(k.split(',')[0][1:]), int(k.split(',')[1][:-1]))
    nk2 = (int(k.split(',')[1][:-1]), int(k.split(',')[0][1:]))
    dis_feature[nk1] = v
    dis_feature[nk2] = v
w = [0.1, 0.1, 0.01]

if __name__ == '__main__':
    point = [0.1 for _ in range(len(c_data['id'][:500]))] * 2
    # bnd = [(-50, 50) for _ in range(len(point))]
    # model = minimize(obj_func, x0=point, method='CG', bounds=bnd, options={'maxiter': 1})
    # print(model.x)
    # 上面是调库，下面开始自己写的
    # 三个函数f1,f2,f3
    # 导数，f1参考tsne导数，f2导数2,f3导数自己算的
    init_model = TSNE()
    init_model.fit(current_feature)
    # x = np.random.rand(500, 2)
    x = init_model.embedding_
    x = transform_x(x)
    nx = minimize_momentum(x, eta=0.01, gamma=0.01, max_iter=5)
    ch = nx - x
    with open("ans_json.json", 'w', encoding='utf-8') as f:
        json.dump({"id": c_data['id'][:500], "position": x}, f, indent=4, ensure_ascii=False, cls=NumpyEncoder)
