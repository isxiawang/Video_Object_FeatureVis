from django.http import JsonResponse
import numpy as np
import json
from Graph_propagation import LapSVM

def graph_propagation(request):
    if request.method == "POST":
        dict = request.POST.get("dict", None)
        print("dict---------------------------------------------------------")
        dict = eval(dict)
        print(dict)

        l_index = dict["l_index"]
        Yl = dict["Yl"]
        print(l_index)
        print(Yl)

        # X代表样本特征，Y代表人工反馈的标签
        reid_data = pandas.read_json('static\data\ForQueryFilter\\feature_list.json')
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
        Y_pre = np.ones(X.shape[0])

        dict = {}
        reid_data["rank"] = Y_
        # print(reid_data)
        # print(reid_data.sort_values(by=['rank'],ascending=False))

        result = np.argsort(-Y_)
        # print()
        # result=reid_data.sort_values(by=['rank'],ascending=False)
        # result=len(result["picture_path_list"].tolist())
        print("反馈信息----------------------------------------------------！！！！！！！")
        print(result)

        dict = {}
        dict["result"] = result.tolist()

        return JsonResponse(json.dumps(dict, ensure_ascii=False), safe=False)
