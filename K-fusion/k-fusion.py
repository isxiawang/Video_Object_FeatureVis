from django.http import JsonResponse
import numpy as np
import json
from Graph_propagation import LapSVM

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
            rank = LapSVM.LapSVM_rerank(pid, rerank_meta_all[key])
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
        rerank_all = LapSVM.LapSVM_rerank(pid, dict)
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