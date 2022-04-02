function picDisplay() {
    /*
    * 获取某个元素下标
    * arr: 传入的数组
    * obj: 需要获取下标的元素
    * */
    function getArrayIndex(arr, obj) {
        var i = arr.length;
        while (i--) {
            if (arr[i] === obj) {
                return i;
            }
        }
        return -1;
    }

    //采用prototype原型实现方式，查找元素在数组中的索引值
    Array.prototype.getArrayIndex = function (obj) {
        for (var i = 0; i < this.length; i++) {
            if (this[i] === obj) {
                return i;
            }
        }
        return -1;
    }


    //定义全局变量
    Yl = []
    l_index = []

    // 获取一些div的长宽用户定义下面的svg
    var w = document.getElementById('query').clientWidth;
    var h = document.getElementById('query').clientHeight;
    var w1 = document.getElementById('Pic').clientWidth;
    var h1 = document.getElementById('Pic').clientHeight;

    //query svg定义
    var svg = d3.select("body")
        .select("#query_parameter")
        .select("#query")
        .select("#probe")
        .append("svg")
        .attr("width", w / 2)
        .attr("height", h);

    //overview svg定义
    // var svg1 = d3.select("body")
    //     .select("#Pic_")
    //     .select("#Pic")
    //     .append("svg")
    //     .attr("width", w1)
    //     .attr("height", h1)
    //     .attr("class", "svg1-back");

    //开始画图

    // d3.json("static/data/ForQueryFilter/display.json", function (error, data) {
    d3.json("static/data/test/display.json", function (error, data) {

        console.log(data);
        //绘制query
        svg.append("svg:image")
            .attr("xlink:href", function (d, i) {
                return data.query;
            })
            .attr("x", 10)
            .attr("y", 20)
            .attr("width", "150")
            .attr("height", "300");


        show_rank(data); //展示rank list
        // show1(data);  //ranklist
        // show2(data);  //tsne投影 + dbscan类别
        // show3(data);  //tsne投影 + dbcsan聚类 + gridlayout + [force_layout + collision]
        // show4(data);  //tsne投影 + dbcsan聚类 + gridlayout + [rank_hot_rect] + [force_layout + collision]
        // show5(data);  //tsne投影 + dbcsan聚类 + gridlayout + [rank_hot_rect] + [drag]
        // show7(data);//tsne投影 + dbcsan聚类 + gridlayout


    });

    //ranklist
    function show_rank(data) {
        var obj = data;
        picture_path_list = obj.picture_path_list;

        console.log(picture_path_list.length)
        //图片视图
        var image_w = 50
        var image_h = 100
        var jiange = 10
        var chushi = 30
        var kuang = 3
        var same = "rgb(3, 129, 3)"
        var similarity = "rgb(55, 185, 245)"
        var dissimilarity = "rgb(245, 55, 83)"

        //像素视图
        var pixel_w = 2.9
        var pixel_h = pixel_w * 16
        var pixel_jiange = 0
        var pixel_kuang = 0

        //写序号
        function draw_order() {
            //定义svg (序号)
            var svg2 = d3.select("body")
                .select("#Pic_")
                .select("#Pic_parameter")
                .append("svg")
                .attr("width", picture_path_list.length * 60 + 60)
                .attr("height", 15)
                .attr("class", "svg2-back");
            //svg2 写序号
            for (var index = 0; index < picture_path_list.length; index++) {
                svg2.append("text")
                    .text(function () {
                        return index;
                    })
                    .attr("fill", "grey")
                    .attr("font-size", "14px")
                    .attr("x", function (d, i) {
                        return index * (image_w + jiange) + chushi + image_w / 2;
                    })
                    .attr("y", function (d, i) {
                        return 10;
                    });
            }
        }

        // draw_order()

        //绘制图片
        //定义svg (第一行rank)
        var svg3 = d3.select("body")
            .select("#Pic_")
            .select("#Pic_parameter")
            .append("svg")
            .attr("width", picture_path_list.length * 60 + 60)
            .attr("height", 120)
            .attr("class", "svg2-back");
        var svg1 = d3.select("body")
            .select("#Pic_")
            .select("#Pic")
            .append("svg")
            .attr("width", w1)
            .attr("height", pixel_h + 10)
            .attr("class", "svg1-back");

        //svg3 开始进行图传播的run图标绘制
        //并添加了点击事件(进行rerank)
        svg3.append("svg:image")
            .attr("xlink:href", function (d, i) {
                return "http://127.0.0.1:8000/static/data/icon/run.png";
            })
            .attr("x", function (d, i) {
                return 5;
            })
            .attr("y", function (d, i) {
                return image_h * 2 / 3;
            })
            .attr("width", "20")
            .attr("height", "20")
            .on("click", function () {
                // l_index = [0, 1, 2, 5]
                // Yl = [1, 1, -1, -1]
                // Yl = []
                // l_index = []
                rectaAll = svg3.selectAll("rect")
                    .attr("x", function () {
                        l_index.push(parseInt(d3.select(this).attr("index")));
                        Yl.push(parseInt(d3.select(this).attr("class")));
                        return d3.select(this).attr("x");
                    });
                console.log(l_index);
                console.log(Yl);
                dict = {"l_index": l_index, "Yl": Yl}
                console.log(dict)
                $.ajax({
                    type: 'POST',
                    url: '../graph_propagation/',
                    dataType: "json",
                    data: {
                        "dict": JSON.stringify(dict),
                    },
                    async: true,
                    success: function (data) {
                        console.log(data);
                        display_propagation(data);
                    }
                });
            });
        //svg3 开始进行图传播的transform图标绘制
        //并添加了点击事件(进行可视化转换)
        svg3.append("svg:image")
            .attr("xlink:href", function (d, i) {
                return "http://127.0.0.1:8000/static/data/icon/transform.png";
            })
            .attr("x", function (d, i) {
                return 5;
            })
            .attr("y", function (d, i) {
                return image_h / 3;
            })
            .attr("width", "20")
            .attr("height", "20")
            .on("click", function () {

            });

        //首次展示rank、反馈图标以及添加反馈操作
        for (var index = 0; index < picture_path_list.length; index++) {
            svg3.append("svg:image")
                .attr("xlink:href", function (d, i) {
                    return picture_path_list[index];
                })
                .attr("x", function (d, i) {
                    return index * (image_w + jiange) + chushi;
                })
                .attr("y", function (d, i) {
                    return kuang;
                })
                .attr("width", image_w)
                .attr("height", image_h);
            svg1.append("svg:image")
                .attr("xlink:href", function (d, i) {
                    return "http://127.0.0.1:8000/static/data/image/compression/c_" + picture_path_list[index].substring(58,);
                })
                .attr("x", function (d, i) {
                    return index * (pixel_w + pixel_jiange) + chushi;
                })
                .attr("y", function (d, i) {
                    return kuang;
                })
                .attr("width", pixel_w)
                .attr("height", pixel_h);
            svg3.append("svg:image")
                .attr("xlink:href", function (d, i) {
                    return "http://127.0.0.1:8000/static/data/icon/same.png";
                })
                .attr("x", function (d, i) {
                    return index * (image_w + jiange) + chushi;
                })
                .attr("y", function (d, i) {
                    return image_h + kuang;
                })
                .attr("index", index)
                .attr("width", "15")
                .attr("height", "15")
                .on("click", function () {
                    x = d3.select(this).attr("x");
                    y = d3.select(this).attr("y");
                    index = d3.select(this).attr("index");
                    svg3.append("rect")
                        .attr("x", function () {
                            return x;
                        })
                        .attr("y", function () {
                            return y - image_h;
                        })
                        .attr("index", index)
                        .attr("class", 1)
                        .attr("width", image_w)
                        .attr("height", image_h)
                        .attr("fill", "rgba(255,0,0,0)")
                        .attr("stroke", function () {
                            return same;
                        })
                        .attr("stroke-width", "5px");
                });
            svg3.append("svg:image")
                .attr("xlink:href", function (d, i) {
                    return "http://127.0.0.1:8000/static/data/icon/similarity.png";
                })
                .attr("x", function (d, i) {
                    return index * (image_w + jiange) + chushi + 15;
                })
                .attr("y", function (d, i) {
                    return image_h + kuang;
                })
                .attr("index", index)
                .attr("width", "15")
                .attr("height", "15")
                .on("click", function () {
                    x = d3.select(this).attr("x");
                    y = d3.select(this).attr("y");
                    index = d3.select(this).attr("index");
                    svg3.append("rect")
                        .attr("x", function () {
                            return index * (image_w + jiange) + chushi;
                        })
                        .attr("y", function (d, i) {
                            return kuang;
                        })
                        .attr("width", image_w)
                        .attr("height", image_h)
                        .attr("fill", "rgba(255,0,0,0)")
                        .attr("stroke", function () {
                            return similarity;
                        })
                        .attr("stroke-width", "5px");
                });
            svg3.append("svg:image")
                .attr("xlink:href", function (d, i) {
                    return "http://127.0.0.1:8000/static/data/icon/dissimilarity.png";
                })
                .attr("x", function (d, i) {
                    return index * (image_w + jiange) + chushi + 15 + 15;
                })
                .attr("y", function (d, i) {
                    return image_h + kuang;
                })
                .attr("width", "15")
                .attr("height", "15")
                .attr("index", index)
                .on("click", function () {
                    x = d3.select(this).attr("x");
                    y = d3.select(this).attr("y");
                    index = d3.select(this).attr("index");
                    svg3.append("rect")
                        .attr("x", function () {
                            return x - 15 - 15;
                        })
                        .attr("y", function () {
                            return y - image_h;
                        })
                        .attr("index", index)
                        .attr("class", -1)
                        .attr("width", image_w)
                        .attr("height", image_h)
                        .attr("fill", "rgba(255,0,0,0)")
                        .attr("stroke", function () {
                            return dissimilarity;
                        })
                        .attr("stroke-width", "5px");
                });
        }

        // 支持进行后续反馈的函数
        function display_propagation(data) {
            data = JSON.parse(data);
            result = data["result"];
            console.log(result)
            console.log(Yl);
            console.log(l_index);
            var svg = d3.select("body")
                .select("#Pic_")
                .select("#Pic_parameter")
                .append("svg")
                .attr("width", picture_path_list.length * 60 + 60)
                .attr("height", 120);
            var svg1 = d3.select("body")
                .select("#Pic_")
                .select("#Pic")
                .append("svg")
                .attr("width", w1)
                .attr("height", pixel_h)
                .attr("class", "svg1-back");

            svg.append("image")
                .attr("xlink:href", function (d, i) {
                    return "http://127.0.0.1:8000/static/data/icon/run.png";
                })
                .attr("x", function (d, i) {
                    return 5;
                })
                .attr("y", function (d, i) {
                    return image_h * 2 / 3;
                })
                .attr("width", "20")
                .attr("height", "20")
                .on("click", function () {
                    // l_index = [0, 1, 2, 5]
                    // Yl = [1, 1, -1, -1]
                    // Yl = []
                    // l_index = []
                    rectaAll = svg.selectAll(".add_rect")
                        .attr("x", function () {
                            l_index.push(result[parseInt(d3.select(this).attr("index"))]);
                            Yl.push(parseInt(d3.select(this).attr("label")));
                            return d3.select(this).attr("x");
                        });
                    dict = {"l_index": l_index, "Yl": Yl}
                    console.log(dict)
                    $.ajax({
                        type: 'POST',
                        url: '../graph_propagation/',
                        dataType: "json",
                        data: {
                            "dict": JSON.stringify(dict),
                        },
                        async: true,
                        success: function (data) {
                            console.log(data);
                            display_propagation(data);
                        }
                    });
                });
            svg.append("svg:image")
                .attr("xlink:href", function (d, i) {
                    return "http://127.0.0.1:8000/static/data/icon/transform.png";
                })
                .attr("x", function (d, i) {
                    return 5;
                })
                .attr("y", function (d, i) {
                    return image_h / 3;
                })
                .attr("width", "20")
                .attr("height", "20")
                .on("click", function () {

                });
            for (var index = 0; index < picture_path_list.length; index++) {
                svg.append("image")
                    .attr("xlink:href", function (d, i) {
                        // console.log(index)
                        return picture_path_list[result[index]];
                    })
                    .attr("x", function (d, i) {
                        return index * (image_w + jiange) + chushi;
                    })
                    .attr("y", function (d, i) {
                        return kuang;
                    })
                    .attr("width", image_w)
                    .attr("height", image_h);
                svg1.append("svg:image")
                    .attr("xlink:href", function (d, i) {
                        return "http://127.0.0.1:8000/static/data/image/compression/c_" + picture_path_list[result[index]].substring(58,);
                    })
                    .attr("x", function (d, i) {
                        return index * (pixel_w + pixel_jiange) + chushi;
                    })
                    .attr("y", function (d, i) {
                        return kuang;
                    })
                    .attr("width", pixel_w)
                    .attr("height", pixel_h);
                svg.append("image")
                    .attr("xlink:href", function (d, i) {
                        return "http://127.0.0.1:8000/static/data/icon/same.png";
                    })
                    .attr("x", function (d, i) {
                        return index * (image_w + jiange) + chushi;
                    })
                    .attr("y", function (d, i) {
                        return image_h + kuang;
                    })
                    .attr("index", index)
                    .attr("width", "15")
                    .attr("height", "15")
                    .on("click", function () {
                        x = d3.select(this).attr("x");
                        y = d3.select(this).attr("y");
                        index = d3.select(this).attr("index");
                        svg.append("rect")
                            .attr("x", function () {
                                return x;
                            })
                            .attr("y", function () {
                                return y - image_h;
                            })
                            .attr("class", "add_rect")
                            .attr("index", index)
                            .attr("label", 1)
                            .attr("width", image_w)
                            .attr("height", image_h)
                            .attr("fill", "rgba(255,0,0,0)")
                            .attr("stroke", function () {
                                return same;
                            })
                            .attr("stroke-width", "5px");
                    });
                svg.append("image")
                    .attr("xlink:href", function (d, i) {
                        return "http://127.0.0.1:8000/static/data/icon/similarity.png";
                    })
                    .attr("x", function (d, i) {
                        return index * (image_w + jiange) + chushi + 15;
                    })
                    .attr("y", function (d, i) {
                        return image_h + kuang;
                    })
                    .attr("index", index)
                    .attr("width", "15")
                    .attr("height", "15")
                    .on("click", function () {
                        x = d3.select(this).attr("x");
                        y = d3.select(this).attr("y");
                        index = d3.select(this).attr("index");
                        svg.append("rect")
                            .attr("x", function () {
                                return x - 15;
                            })
                            .attr("y", function () {
                                return y - image_h;
                            })
                            .attr("class", "add_rect")
                            .attr("index", index)
                            .attr("label", 1)
                            .attr("width", image_w)
                            .attr("height", image_h)
                            .attr("fill", "rgba(255,0,0,0)")
                            .attr("stroke", function () {
                                return similarity;
                            })
                            .attr("stroke-width", "5px");
                    });
                svg.append("svg:image")
                    .attr("xlink:href", function (d, i) {
                        return "http://127.0.0.1:8000/static/data/icon/dissimilarity.png";
                    })
                    .attr("x", function (d, i) {
                        return index * (image_w + jiange) + chushi + 15 + 15;
                    })
                    .attr("y", function (d, i) {
                        return image_h + kuang;
                    })
                    .attr("width", "15")
                    .attr("height", "15")
                    .attr("index", index)
                    .on("click", function () {
                        x = d3.select(this).attr("x");
                        y = d3.select(this).attr("y");
                        index = d3.select(this).attr("index");
                        svg.append("rect")
                            .attr("x", function () {
                                return x - 15 - 15;
                            })
                            .attr("y", function () {
                                return y - image_h;
                            })
                            .attr("class", "add_rect")
                            .attr("index", index)
                            .attr("label", -1)
                            .attr("width", image_w)
                            .attr("height", image_h)
                            .attr("fill", "rgba(255,0,0,0)")
                            .attr("stroke", function () {
                                return dissimilarity;
                            })
                            .attr("stroke-width", "5px");
                    });
            }
            //    上一次被选择的样本
            for (var ii = 0; ii < Yl.length; ii++) {
                svg.append("rect")
                    .attr("x", function () {
                        return result.getArrayIndex(l_index[ii]) * (image_w + jiange) + chushi;
                    })
                    .attr("y", function () {
                        return kuang;
                    })
                    .attr("width", image_w)
                    .attr("height", image_h)
                    .attr("fill", "rgba(255,0,0,0)")
                    .attr("stroke", function () {
                        if (Yl[ii] == 1)
                            return same;
                        if (Yl[ii] == -1)
                            return dissimilarity;
                    })
                    .attr("stroke-width", "5px");
            }
        }

    }


    function show1(data) {
        var obj = data;
        feature_tsne_result = obj.feature_tsne_result;
        picture_path_list = obj.picture_path_list;
        // gallery中的结果svg

        var svg0 = d3.select("body")
            .select("#Pic_")
            .select("#Pic")
            .append("svg")
            .attr("width", w1)
            .attr("height", 200)
            .attr("id", "svg0");
        var linechart_xlinear = d3.scaleLinear()
            .domain([0, 500])
            .range([0, w1]);
        var linechart_ylinear = d3.scaleLinear()
            .domain([0, 2])
            .range([0, 200]);

        svg0
            .selectAll("circle")
            .data(picture_path_list)
            .enter()
            .append("circle")
            .attr("cx", function (d, i) {
                // console.log(i);
                return linechart_xlinear(i);
            })
            .attr("cy", function (d, i) {
                console.log(linechart_ylinear(1));
                return linechart_ylinear(1);
            })
            .attr("r", 1)
            .attr("fill", "black");

        svg1
            .selectAll("image")
            .data(picture_path_list)
            .enter()
            .append("svg:image")
            .attr("xlink:href", function (d, i) {
                return picture_path_list[i];
            })
            .attr("x", function (d, i) {
                return xlinear(feature_tsne_result[i][0]);
            })
            .attr("y", function (d, i) {
                return yAxisWidth - ylinear(feature_tsne_result[i][1]);
            })
            // .attr("width", "10")
            .attr("height", "10");


    }

    //tsne投影 + dbscan类别
    function show2(data) {
        var obj = data;
        var color = d3.scaleOrdinal(d3.schemeCategory10);
        feature_tsne_result = obj.feature_tsne_result;
        picture_path_list = obj.picture_path_list;
        picture_true_list = obj.picture_true_list;
        lables = obj.lables;
        console.log(lables)
        // gallery中的结果svg

        //外边框
        var padding = {top: 100, right: 60, bottom: 100, left: 60}
        //比例尺
        var xAxisWidth = w1
        var yAxisWidth = h1
        console.log("xAxisWidth")
        console.log(xAxisWidth)
        console.log("yAxisWidth")
        console.log(yAxisWidth)
        x_min = d3.min(feature_tsne_result, function (d) {
            return d[0];
        })
        x_max = d3.max(feature_tsne_result, function (d) {
            return d[0];
        })
        y_min = d3.min(feature_tsne_result, function (d) {
            return d[1];
        })
        y_max = d3.max(feature_tsne_result, function (d) {
            return d[1];
        })
        var xlinear = d3.scaleLinear()
            .domain([x_min, x_max])
            .range([0 + padding.left, xAxisWidth - padding.right]);
        var ylinear = d3.scaleLinear()
            .domain([y_min, y_max])
            .range([0 + padding.top, yAxisWidth - padding.bottom]);

        //绘制目标行人图片
        svg1
            .selectAll("image")
            .data(feature_tsne_result)
            .enter()
            .append("svg:image")
            .attr("xlink:href", function (d, i) {
                return picture_path_list[i];
            })
            .attr("x", function (d, i) {
                return xlinear(feature_tsne_result[i][0]);
            })
            .attr("y", function (d, i) {
                return ylinear(feature_tsne_result[i][1]);
            })
            // .attr("width", "10")
            .attr("height", function (d, i) {
                // if (i == 1)
                //     return "100"
                return "30";
            });
        svg1
            .selectAll("rect")
            .data(picture_true_list)
            .enter()
            .append("rect")
            .attr("x", function (d, i) {
                return xlinear(feature_tsne_result[i][0]);
            })
            .attr("y", function (d, i) {
                return ylinear(feature_tsne_result[i][1]);
            })
            .attr("width", function (d, i) {
                // if (i == 1)
                //     return "50"
                return "15";
            })
            .attr("height", function (d, i) {
                // if (i == 1)
                //     return "100"
                return "30";
            })
            .attr("fill", "rgba(255,0,0,0)")
            .attr("stroke", function (d, i) {
                return color(lables[i]);
                // if (parseInt(picture_true_list[i]) == 0) {
                //     return "rgba(255,0,0,0)";
                // } else if (parseInt(picture_true_list[i]) == 1) {
                //     return "red";
                // }
            })
            .attr("stroke-width", "1px");
    }

    //tsne投影 + dbcsan聚类 + gridlayout + [force_layout + collision]
    function show3(data) {
        var obj = data;
        var color = d3.scaleOrdinal(d3.schemeCategory10);
        cluster = obj.cluster
        console.log(cluster)
        center = obj.center
        console.log(center)
        bian = obj.bian
        console.log(bian)
        // gallery中的结果svg


        console.log("开始画图");


        //力导向+碰撞检测
        var forceX = d3.forceX(function (d) {
            return d[0]
        })
            .strength(0.1)

        var forceY = d3.forceY(function (d) {
            return d[1]
        })
            .strength(0.1)
        var collide = d3.bboxCollide(function (d, i) {
            return [[-2, -2], [2, 2]]
        })
            .strength(0.5)
            .iterations(1)
        var force = d3.forceSimulation(center)
            .velocityDecay(0.08)
            .force("x", forceX)
            .force("y", forceY)
            .force("collide", collide)
            .on("tick", updateNetwork);

        svg1
            .selectAll("g")
            .data(center)
            .enter()
            .append("g")
            .attr("id", function (d, i) {
                return "cluster" + i.toString();
            })
            .style("width", function (d, i) {
                return bian[i] * 20;
            })
            .style("height", function (d, i) {
                return bian[i] * 20;
            })
            .style("x", function (d) {
                return d[0]
            })
            .style("y", function (d) {
                return d[1]
            });

        var number = 0;

        function updateNetwork() {
            number = number + 1;
            //外边框
            var padding = {top: 100, right: 180, bottom: 230, left: 60}
            //比例尺
            var xAxisWidth = w1
            var yAxisWidth = h1
            x_min = d3.min(center, function (d) {
                return d[0];
            })
            x_max = d3.max(center, function (d) {
                return d[0];
            })
            y_min = d3.min(center, function (d) {
                return d[1];
            })
            y_max = d3.max(center, function (d) {
                return d[1];
            })
            var xlinear = d3.scaleLinear()
                .domain([x_min, x_max])
                .range([0 + padding.left, xAxisWidth - padding.right]);
            var ylinear = d3.scaleLinear()
                .domain([y_min, y_max])
                .range([0 + padding.top, yAxisWidth - padding.bottom]);

            svg1.selectAll("g")
                .transition()
                .duration(30)
                .attr("transform", function (d) {
                    return "translate(" + xlinear(d.x) + "," + ylinear(d.y) + ")";
                })
        }

        for (var index = 0; index < cluster.length; index++) {
            image_path_list = cluster[index][0]
            bian_list = cluster[index][1]
            console.log(image_path_list)
            console.log((bian_list))
            d3.select("#cluster" + index.toString())
                .append("rect")
                .attr("x", 0)
                .attr("width", bian[index] * 30)
                .attr("height", bian[index] * 30)
                .attr("fill", "rgb(255,0,0,0)")
                .attr("stroke", "black");
            let select = d3.select("#cluster" + index.toString())
                .selectAll("image")
                .data(image_path_list)
                .enter()
                .append("svg:image")
                .attr("xlink:href", function (d, i) {
                    return image_path_list[i];
                })
                .attr("x", function (d, i) {
                    return 30 * (i % bian_list) + 5;
                })
                .attr("y", function (d, i) {
                    return parseInt(i / bian_list) * 30;
                })
                // .attr("width", "10")
                .attr("height", function (d, i) {
                    // if (i == 1)
                    //     return "100"
                    return "30";
                });
        }
    }

    //tsne投影 + dbcsan聚类 + gridlayout + [rank_hot_rect] + [force_layout + collision]
    function show4(data) {
        var obj = data;
        cluster = obj.cluster
        center = obj.center
        bian = obj.bian

        // gallery中的结果svg
        //力导向+碰撞检测
        var forceX = d3.forceX(function (d) {
            return d[0]
        })
            .strength(0.1)

        var forceY = d3.forceY(function (d) {
            return d[1]
        })
            .strength(0.1)
        var collide = d3.bboxCollide(function (d, i) {
            return [[-3, -3], [3, 3]]
        })
            .strength(1)
            .iterations(2)
        var force = d3.forceSimulation(center)
            .velocityDecay(0.3)
            .force("x", forceX)
            .force("y", forceY)
            .force("collide", collide)
            .on("tick", updateNetwork);

        svg1
            .selectAll("g")
            .data(center)
            .enter()
            .append("g")
            .attr("id", function (d, i) {
                return "cluster" + i.toString();
            })
            .style("width", function (d, i) {
                return bian[i] * 20;
            })
            .style("height", function (d, i) {
                return bian[i] * 20;
            })
            .style("x", function (d) {
                return d[0]
            })
            .style("y", function (d) {
                return d[1]
            });

        var number = 0;

        function updateNetwork() {
            number = number + 1;
            //外边框
            var padding = {top: 50, right: 50, bottom: 50, left: 50}
            //比例尺
            var xAxisWidth = w1
            var yAxisWidth = h1
            x_min = d3.min(center, function (d) {
                return d[0];
            })
            x_max = d3.max(center, function (d) {
                return d[0];
            })
            y_min = d3.min(center, function (d) {
                return d[1];
            })
            y_max = d3.max(center, function (d) {
                return d[1];
            })
            var xlinear = d3.scaleLinear()
                .domain([x_min, x_max])
                .range([0 + padding.left, xAxisWidth - padding.right]);
            var ylinear = d3.scaleLinear()
                .domain([y_min, y_max])
                .range([0 + padding.top, yAxisWidth - padding.bottom]);

            svg1.selectAll("g")
                .transition()
                .duration(30)
                .attr("transform", function (d) {
                    return "translate(" + xlinear(d.x) + "," + ylinear(d.y) + ")";
                })
        }

        //热力图颜色比例尺
        var scaleColor = d3.scaleLinear()
            .domain([1, 0])
            .range(["white", "green"]);

        var hot_rect_s = 5
        var cluster_padding = 3

        for (var index = 0; index < cluster.length; index++) {
            image_path_list = cluster[index][0]
            bian_list = cluster[index][1]
            rank_list = cluster[index][3]
            d3.select("#cluster" + index.toString())
                .append("rect")
                .attr("x", 0)
                .attr("width", bian[index] * hot_rect_s + 2 * cluster_padding)
                .attr("height", bian[index] * hot_rect_s + 2 * cluster_padding)
                .attr("fill", "rgb(255,0,0,0)")
                .attr("stroke", "black");
            for (var k = 0; k < rank_list.length; k++) {
                d3.select("#cluster" + index.toString())
                    .append("rect")
                    .attr("x", function () {
                        return hot_rect_s * (k % bian_list) + cluster_padding;
                    })
                    .attr("y", function () {
                        return parseInt(k / bian_list) * hot_rect_s + cluster_padding;
                    })
                    .attr("width", hot_rect_s)
                    .attr("height", hot_rect_s)
                    .attr("fill", function (d, i) {
                        return scaleColor(rank_list[k] / 500);
                    })
                    .attr("stroke", "black");
            }
        }
    }

    //tsne投影 + dbcsan聚类 + gridlayout + [rank_hot_rect] + [drag]
    function show5(data) {
        // 一些常量的设定

        //overview的参数
        var padding = {top: 10, right: 50, bottom: 50, left: 50}
        //热力图颜色比例尺
        var scaleColor = d3.scaleLinear()
            .domain([1, 0])
            .range(["white", "green"]);
        //horect边长等
        var hot_rect_s = 10
        var cluster_padding = 3


        //要可视化的信息
        var obj = data;
        cluster = obj.cluster
        center = obj.center
        bian = obj.bian

        //比例尺
        var xAxisWidth = w1
        var yAxisWidth = h1
        x_min = d3.min(center, function (d) {
            return d[0];
        })
        x_max = d3.max(center, function (d) {
            return d[0];
        })
        y_min = d3.min(center, function (d) {
            return d[1];
        })
        y_max = d3.max(center, function (d) {
            return d[1];
        })
        var xlinear = d3.scaleLinear()
            .domain([x_min, x_max])
            .range([0 + padding.left, xAxisWidth - padding.right]);
        var ylinear = d3.scaleLinear()
            .domain([y_min, y_max])
            .range([0 + padding.top, yAxisWidth - padding.bottom]);
        var drag = d3.drag()
            .on("start", function (d) {
                // console.log("拖曳开始");
            })
            .on("end", function (d) {
                // console.log("拖曳结束");
            })
            .on("drag", function (d) {
                d3.select(this)
                    .attr("transform", "translate(" + d3.event.x + "," + d3.event.y + ")");
            });

        //绘制overview
        front_end_bian = []
        front_end_center = []
        for (var index = 0; index < cluster.length; index++) {
            image_path_list = cluster[index][0]
            bian_list = cluster[index][1]
            rank_list = cluster[index][3]
            c_number = rank_list.length
            //  为每一个cluster生成一个"g"
            svg1
                .append("g")
                .attr("id", function () {
                    return "cluster" + index.toString();
                })
                .style("width", function () {
                    return bian[index] * 20;
                })
                .style("height", function (d, i) {
                    return bian[index] * 20;
                })
                .attr("transform", function (d, i) {
                    front_end_bian.push(bian[index] * hot_rect_s + 2 * cluster_padding);
                    front_end_center.push([xlinear(center[index][0]), ylinear(center[index][1])]);
                    return "translate(" + xlinear(center[index][0]) + "," + ylinear(center[index][1]) + ")";
                })
                .call(drag);

            //  在每一个cluster的"g"中绘制一个边框"rect"
            //  添加了点击时间(变成image/变成hotrect)
            d3.select("#cluster" + index.toString())
                .append("rect")
                .attr("id", function () {
                    return "cluster_rect" + index.toString();
                })
                .attr("class", "hotrect")
                .attr("transform", function (d, i) {
                    return "translate(" + 0 + "," + 0 + ")";
                })
                .attr("width", bian[index] * hot_rect_s + 2 * cluster_padding)
                .attr("height", function () {
                    if (c_number % bian[index] == 0)
                        return parseInt(c_number / bian[index]) * hot_rect_s + 2 * cluster_padding;
                    if (c_number % bian[index] > 0)
                        return (parseInt(c_number / bian[index]) + 1) * hot_rect_s + 2 * cluster_padding;
                })
                .attr("fill", "rgb(255,0,0,0)")
                .attr("stroke", "black")
                .on("click", function () {
                    console.log("初始:click cluster rect");
                    click_index = d3.select(this).attr("id").substring(12,);
                    console.log(parseInt(click_index));
                    click_index = parseInt(click_index);
                    // overview_click_draw_image(cluster, click_index);
                    class_status = d3.select(this).attr("class");
                    console.log(class_status);
                    if (class_status == "hotrect") {
                        //    绘制image
                        overview_click_draw_image(cluster, click_index);
                    } else if (class_status == "image") {
                        //    绘制hotrect
                        overview_click_draw_hotrect(cluster, click_index);
                    }
                });
            //  在每一个cluster的"g"中绘制一个一个样本的信息(hotrect)
            for (var k = 0; k < rank_list.length; k++) {
                d3.select("#cluster" + index.toString())
                    .append("rect")
                    .attr("x", function () {
                        return hot_rect_s * (k % bian_list) + cluster_padding;
                    })
                    .attr("y", function () {
                        return parseInt(k / bian_list) * hot_rect_s + cluster_padding;
                    })
                    .attr("width", hot_rect_s)
                    .attr("height", hot_rect_s)
                    .attr("fill", function (d, i) {
                        return scaleColor(rank_list[k] / 500);
                    })
                    .attr("stroke", function () {
                        return "black";
                    });
            }
        }
        console.log(front_end_bian);
        console.log(front_end_center);

        function overview_click_draw_image(cluster, index) {
            var image_w = 30
            var image_h = 60
            var cluster_padding = 3


            //删掉原来的"g"
            svg1.select("#cluster" + index.toString()).remove()

            //绘制新的"g"
            svg1
                .append("g")
                .attr("id", function () {
                    return "cluster" + index.toString();
                })
                .style("width", function () {
                    return bian[index] * 20;
                })
                .style("height", function (d, i) {
                    return bian[index] * 20;
                })
                .attr("transform", function (d, i) {
                    return "translate(" + xlinear(center[index][0]) + "," + ylinear(center[index][1]) + ")";
                })
                .call(drag);


            image_path_list = cluster[index][0]
            bian_list = cluster[index][1]
            rank_list = cluster[index][3]
            c_number = rank_list.length

            //绘制新的边框"rect"
            d3.select("#cluster" + index.toString())
                .append("rect")
                .attr("id", function () {
                    return "cluster_rect" + index.toString();
                })
                .attr("transform", function (d, i) {
                    return "translate(" + 0 + "," + 0 + ")";
                })
                .attr("class", "image")
                .attr("width", bian[index] * image_h + 2 * cluster_padding)
                .attr("height", bian[index] * image_h + 2 * cluster_padding)
                .attr("fill", "rgb(255,0,0,0)")
                .attr("stroke", "black")
                .on("click", function () {
                    console.log("变image:click cluster rect");
                    click_index = d3.select(this).attr("id").substring(12,);
                    click_index = parseInt(click_index);
                    class_status = d3.select(this).attr("class")
                    console.log(class_status);
                    if (class_status == "hotrect") {
                        //    绘制image
                        overview_click_draw_image(cluster, click_index);
                    } else if (class_status == "image") {
                        //    绘制hotrect
                        overview_click_draw_hotrect(cluster, click_index);
                    }
                });
            //填充image
            for (var k = 0; k < rank_list.length; k++) {
                d3.select("#cluster" + index.toString())
                    .append("svg:image")
                    .attr("xlink:href", function () {
                        return image_path_list[k];
                    })
                    .attr("x", function () {
                        return image_w * parseInt(k % bian_list) + cluster_padding;
                    })
                    .attr("y", function () {
                        return image_h * parseInt(k / bian_list) + cluster_padding;
                    })
                    .attr("width", image_w)
                    .attr("height", image_h)
                ;
            }
        }

        function overview_click_draw_hotrect(cluster, index) {
            var hot_rect_s = 10
            var cluster_padding = 3


            //删掉原来的"g"
            svg1.select("#cluster" + index.toString()).remove()

            //绘制新的"g"
            svg1
                .append("g")
                .attr("id", function () {
                    return "cluster" + index.toString();
                })
                .style("width", function () {
                    return bian[index] * 20;
                })
                .style("height", function (d, i) {
                    return bian[index] * 20;
                })
                .attr("transform", function (d, i) {
                    return "translate(" + xlinear(center[index][0]) + "," + ylinear(center[index][1]) + ")";
                })
                .call(drag);

            image_path_list = cluster[index][0]
            bian_list = cluster[index][1]
            rank_list = cluster[index][3]
            c_number = rank_list.length

            //绘制新的边框"rect"
            d3.select("#cluster" + index.toString())
                .append("rect")
                .attr("id", function () {
                    return "cluster_rect" + index.toString();
                })
                .attr("transform", function (d, i) {
                    return "translate(" + 0 + "," + 0 + ")";
                })
                .attr("class", "hotrect")
                .attr("width", bian[index] * hot_rect_s + 2 * cluster_padding)
                .attr("height", function () {
                    if (c_number % bian[index] == 0)
                        return parseInt(c_number / bian[index]) * hot_rect_s + 2 * cluster_padding;
                    if (c_number % bian[index] > 0)
                        return (parseInt(c_number / bian[index]) + 1) * hot_rect_s + 2 * cluster_padding;
                })
                .attr("fill", "rgb(255,0,0,0)")
                .attr("stroke", "black")
                .on("click", function () {
                    console.log("变hotrect:click cluster rect");
                    click_index = d3.select(this).attr("id").substring(12,);
                    click_index = parseInt(click_index);
                    class_status = d3.select(this).attr("class")
                    console.log(class_status);
                    if (class_status == "hotrect") {
                        //    绘制image
                        overview_click_draw_image(cluster, click_index);
                    } else if (class_status == "image") {
                        //    绘制hotrect
                        overview_click_draw_hotrect(cluster, click_index);
                    }
                });
            //填充hotrect
            for (var k = 0; k < rank_list.length; k++) {
                d3.select("#cluster" + index.toString())
                    .append("rect")
                    .attr("x", function () {
                        return hot_rect_s * (k % bian_list) + cluster_padding;
                    })
                    .attr("y", function () {
                        return parseInt(k / bian_list) * hot_rect_s + cluster_padding;
                    })
                    .attr("width", hot_rect_s)
                    .attr("height", hot_rect_s)
                    .attr("fill", function (d, i) {
                        return scaleColor(rank_list[k] / 500);
                    })
                    .attr("stroke", function () {
                        return "black";
                    });
            }
        }
    }


    //tsne投影 + dbcsan聚类 + gridlayout + [drag]
    function show6(data) {
        var obj = data;
        var color = d3.scaleOrdinal(d3.schemeCategory10);
        // feature_tsne_result = obj.feature_tsne_result;
        // picture_path_list = obj.picture_path_list;
        // picture_true_list = obj.picture_true_list;
        // lables=obj.lables;
        cluster = obj.cluster
        center = obj.center
        bian = obj.bian
        // gallery中的结果svg


        console.log("开始画图");
        var padding = {top: 30, right: 180, bottom: 290, left: 60}
        //比例尺
        var xAxisWidth = w1
        var yAxisWidth = h1
        x_min = d3.min(center, function (d) {
            return d[0];
        })
        x_max = d3.max(center, function (d) {
            return d[0];
        })
        y_min = d3.min(center, function (d) {
            return d[1];
        })
        y_max = d3.max(center, function (d) {
            return d[1];
        })
        var xlinear = d3.scaleLinear()
            .domain([x_min, x_max])
            .range([0 + padding.left, xAxisWidth - padding.right]);
        var ylinear = d3.scaleLinear()
            .domain([y_min, y_max])
            .range([0 + padding.top, yAxisWidth - padding.bottom]);
        var drag = d3.drag()
            // .origin(function (d, i) {
            //     return {x: d.x, y: d.y};
            // })
            .on("start", function (d) {
                // console.log("拖曳开始");
            })
            .on("end", function (d) {
                // console.log("拖曳结束");
            })
            .on("drag", function (d) {
                d3.select(this)
                    .attr("transform", "translate(" + d3.event.x + "," + d3.event.y + ")");
            });
        //力导向+碰撞检测
        svg1
            .selectAll("g")
            .data(center)
            .enter()
            .append("g")
            .attr("id", function (d, i) {
                return "cluster" + i.toString();
            })
            .style("width", function (d, i) {
                return bian[i] * 20;
            })
            .style("height", function (d, i) {
                return bian[i] * 20;
            })
            .attr("transform", function (d, i) {
                return "translate(" + xlinear(d[0]) + "," + ylinear(d[1]) + ")";
            })
            .call(drag);


        //热力图颜色比例尺
        var scaleColor = d3.scaleLinear()
            .domain([1, 0])
            .range(["white", "green"]);
        for (var index = 0; index < cluster.length; index++) {
            // g = svg1.append("g")
            //     .attr("id", "cluster" + i.toString())
            //     .attr("transform", "translate(" + xlinear(cluster[i][2][0]) + "," + ylinear(cluster[i][2][1]) + ")")
            //     .attr("width", "10")
            //     .attr("height", "30");

            image_path_list = cluster[index][0]
            bian_list = cluster[index][1]
            rank_list = cluster[index][3]
            d3.select("#cluster" + index.toString())
                .append("rect")
                .attr("transform", function (d, i) {
                    return "translate(" + 0 + "," + 0 + ")";
                })
                .attr("width", bian[index] * 40)
                .attr("height", bian[index] * 40)
                .attr("fill", "rgb(255,0,0,0)")
                .attr("stroke", "grey");
            for (var k = 0; k < rank_list.length; k++) {
                d3.select("#cluster" + index.toString())
                    .selectAll("image")
                    .data(image_path_list)
                    .enter()
                    .append("svg:image")
                    .attr("xlink:href", function (d, i) {
                        return image_path_list[i];
                    })
                    .attr("x", function (d, i) {
                        return 40 * (i % bian_list) + 5;
                    })
                    .attr("y", function (d, i) {
                        return parseInt(i / bian_list) * 40;
                    })
                    // .attr("width", "10")
                    .attr("height", function (d, i) {
                        // if (i == 1)
                        //     return "100"
                        return "40";
                    });

            }
        }
    }

    //交互式的界面
    function show7(data) {
        //overview : [rank_hot_rect]
        show5(data)


    }


}