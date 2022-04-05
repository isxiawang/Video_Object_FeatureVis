import gurobipy as gp
import json
from gurobipy import *
def occlussion(bianchang,center){
m = gp.Model(" rectOCC ")
# m.setParam('nonconvex', 2)
# Create variables
x = {}
y = {}
a = {}
b = {}
c = {}
d = {}
BigM = 1000000
border = [1536, 658]
for i in range(0, len(bianchang)):
    # add去除遮挡之后的坐标
    x[i] = m.addVar(name="x" + str(i))
    y[i] = m.addVar(name="y" + str(i))
    for j in range(0, len(bianchang)):
        # add 0/1变量
        a[i, j] = m.addVar(vtype=GRB.BINARY, name="a_" + str(i) + '_' + str(j))
        b[i, j] = m.addVar(vtype=GRB.BINARY, name="b_" + str(i) + '_' + str(j))
        c[i, j] = m.addVar(vtype=GRB.BINARY, name="c_" + str(i) + '_' + str(j))
        d[i, j] = m.addVar(vtype=GRB.BINARY, name="d_" + str(i) + '_' + str(j))

# Set objective
obj = QuadExpr(0)
for i in range(0, len(bianchang)):
    obj.addTerms(1, x[i], x[i])
    obj.addTerms(1, y[i], y[i])
    obj.addTerms(-2 * center[i][0], x[i])
    obj.addTerms(-2 * center[i][1], y[i])
# for i in range(0, len(bianchang)):
#     for j in range(0, len(bianchang)):
#         obj.addTerms(1, a[i, j], a[i, j])
#         obj.addTerms(1, b[i, j], b[i, j])
m.setObjective(obj, GRB.MINIMIZE)

# Add constraint c1_ rectangle overlap
for i in range(0, len(bianchang)):
    for j in range(0, len(bianchang)):
        if i != j:
            m.addConstr(x[i] - x[j] + BigM * (1 - a[i, j]) >= bianchang[i], name='right_' + str(i) + '_' + str(j))
            m.addConstr(x[j] - x[i] + BigM * (1 - b[i, j]) >= bianchang[j], name='left_' + str(i) + '_' + str(j))
            m.addConstr(y[i] - y[j] + BigM * (1 - c[i, j]) >= bianchang[i], name='bottom_' + str(i) + '_' + str(j))
            m.addConstr(y[j] - y[i] + BigM * (1 - d[i, j]) >= bianchang[j], name='top_' + str(i) + '_' + str(j))
            # m.addConstr(c[i, j] >= (bianchang[i] + bianchang[j]) * 25)
            # m.addConstr(d[i, j] >= (bianchang[i] + bianchang[j]) * 25)

# Add constraint c3_ direction a,b,c,d
for i in range(0, len(bianchang)):
    for j in range(0, len(bianchang)):
        if i != j:
            m.addConstr(a[i, j] + b[i, j] + c[i, j] + d[i, j] == 1, name="dir_" + str(i) + '_' + str(j))

# Add constraint border
for i in range(len(bianchang)):
    m.addConstr(0 <= x[i], name='border1_' + str(i))
    m.addConstr(x[i] <= border[0] - bianchang[i], name='border2_' + str(i))
    m.addConstr(bianchang[i] <= y[i], name='border3_' + str(i))
    m.addConstr(y[i] <= border[1], name='border4_' + str(i))

# Optimize model
m.setParam('MIPFocus', 1)
m.setParam('MIPGap', 1)
m.setParam('TimeLimit', 25)
m.optimize()
m.write("gd.lp")
# 打印结果
print("\n\n-----optimal value-----")
# print('......', x)

#
for key in x.keys():
    print(x[key].VarName, x[key].x)
    print(y[key].VarName, y[key].x)
for key in a.keys():
    print(a[key].VarName, a[key].x)
    print(b[key].VarName, b[key].x)
    print(c[key].VarName, c[key].x)
    print(d[key].VarName, d[key].x)
    # if(x[key]> 0 ):
    #    print(x[key] + ' = ', x[key])

ans = {}
ii = 0
for key in range(len(bianchang)):
    ans[str(ii)] = {'x': x[key].x, 'y': y[key].x, 'width': bianchang[ii] * 5, 'height': bianchang[ii] * 5}
    ii += 1

with open(os.getcwd() + '/layout_ans.json', 'w') as f:
    json.dump(ans, f, indent=4, ensure_ascii=True)

}
