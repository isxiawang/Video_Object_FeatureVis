from django.http import JsonResponse
import numpy as np
from scipy.optimize import minimize
from scipy.spatial.distance import cdist
from sklearn.neighbors import kneighbors_graph
from scipy import sparse
import json
import pandas
import numpy


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