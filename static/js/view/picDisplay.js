//定义全局变量
Yl = []
l_index = []

//每一次的顺序
result_list = []
// 历次反馈记录
feedback_list = {}
// var route_g;

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


//一行svg中的rank图片视图
var image_w = 50
var image_h = 100
var jiange = 10
var chushi = 30
var kuang = 3


//框框颜色
var same = "rgb(3, 129, 3)"
var similarity = "rgb(55, 185, 245)"
var dissimilarity = "rgb(245, 55, 83)"

//一行svg中的rank像素视图
var pixel_w = 2.9
var pixel_h = pixel_w * 16
// var pixel_w = 30
// var pixel_h = 60
var pixel_jiange = 0
var hang_h = 100

// 获取一些div的长宽用户定义下面的svg
var w1 = document.getElementById('Pic').clientWidth;
var h1 = document.getElementById('Pic').clientHeight;
var h2 = document.getElementById('jian_bian_dai').clientHeight;

//渐变带svg
var jianbiandai_svg = d3.select("body")
    .select("#Pic_")
    .select("#Pic")
    .select("#jian_bian_dai")
    .append("svg")
    .attr("width", w1)
    .attr("height", h2);

//overview_svg定义
var svg1 = d3.select("body")
    .select("#Pic_")
    .select("#Pic")
    .append("svg")
    .attr("width", w1)
    .attr("height", h1)
    .attr("id", "svg1");


function picDisplay(pid) {
    pid = pid.substr(0, 19);
    d3.json("../static/data/Display/" + pid + "_display.json", function (error, data) {
        // console.log(data);


        show_rank(data, pid); //展示rank list
        // show1(data);  //ranklist
        // show2(data);  //tsne投影 + dbscan类别
        // show3(data);  //tsne投影 + dbcsan聚类 + gridlayout + [force_layout + collision]
        // show4(data);  //tsne投影 + dbcsan聚类 + gridlayout + [rank_hot_rect] + [force_layout + collision]
        // show5(data);  //tsne投影 + dbcsan聚类 + gridlayout + [rank_hot_rect] + [drag]
        show7(data);//tsne投影 + dbcsan聚类 + gridlayout


    });

    //initial ranklist
    function show_rank(data, pid) {
        // console.log("datadatadatadatadatadatadata")
        // console.log(data)
        var obj = data;
        var pid = pid;
        picture_path_list = obj.picture_path_list;
        lables = obj.lables;
        ci_list = obj.ci_list;


        //生成初始排序
        init_data = []
        for (i = 0; i < picture_path_list.length; i++)
            init_data.push(i);

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

        draw_rank_init(init_data, pid, data)


    }

    //一行rank的绘制
    function draw_rank(data, pid, result1) {
        ci_list = data["ci_list"]
        picture_path_list = data["picture_path_list"]
        lables = data["lables"]
        dis_fangcha = data["dis_fangcha"];

        console.log("draw_rank");
        var hang = result_list.length;
        result_list.push(result1);
        feedback_list[hang + 1] = [];
        console.log("feedback_list")
        console.log(feedback_list)

        //---------------------------------------------------------------------------------------------------
        //新建rank_svg
        var rank_svg = new_rank_svg();

        //绘制run
        draw_run(rank_svg, pid, result1);

        //绘制transform
        draw_transform(rank_svg);

        //绘制图片
        draw_image(rank_svg, result1, data);

        //历史反馈
        draw_history(rank_svg, result1);

        //历史反馈、传播路径
        draw_feedback_list(data);


        // //---------------------------------------------------------------------------------------------------
        //新建compression_svg
        var compression_svg = new_compression_svg();

        //绘制压缩图片
        draw_compression(compression_svg, result1, hang);

        //连线
        // if (result_list.length > 1) {
        //     //与上一个rank连线
        //     draw_relation(compression_svg, result_list, hang);
        // }
        // //---------------------------------------------------------------------------------------------------

    }


    //历史反馈、传播路径
    function draw_feedback_list(data) {
        console.log("开始话路径");
        console.log(feedback_list);
        console.log(data);
        route = {}

        for (var key in feedback_list) {
            var item = feedback_list[key];
            for (var i = 0; i < item.length; i++) {
                cluster_id = d3.select("#overview" + item[i]);
                // console.log(cluster_id["_groups"][0][0]);
                // console.log(typeof (cluster_id));
                if (cluster_id["_groups"][0][0] === null) {
                    // console.log("is null");
                } else {
                    cluster_id = cluster_id.attr("index_num");
                    rect_id = d3.select("#overview" + item[i]).attr("rect_num");

                    // console.log(rect_id);
                    //填充路径信息
                    if (route.hasOwnProperty(cluster_id.toString())) {
                        // console.log("现有现有现有现有现有现有现有");
                        route[cluster_id.toString()].push(dis_fangcha[rect_id]);
                    } else {
                        // console.log("新建新建新建v新建新建新建新建新建");
                        route[cluster_id.toString()] = [dis_fangcha[rect_id]]
                    }
                }
            }
            for (var i = 0; i < item.length; i++) {
                cluster_id = d3.select("#overview" + item[i]);
                // console.log(cluster_id["_groups"][0][0]);
                // console.log(typeof (cluster_id));
                if (cluster_id["_groups"][0][0] === null) {
                    // console.log("is null");
                } else {
                    cluster_id = cluster_id.attr("index_num");
                    overview_click_draw_image_his(cluster_id, data, key);
                    // console.log("#overview" + item[i]);
                }
            }

            for (var j = 0; j < item.length; j++) {
                // console.log("#image" + item[j]);
                d3.select("#image_" + item[j]).attr("fill", same);
            }
        }
        //    绘制路径
        console.log("route");
        console.log(route);
        for (var key in route) {
            num = 0;
            item = route[key];
            for (var i = 0; i < item.length; i++) {
                num = num + item[i];
            }
            junzhi = num / item.length;
            route[key] = junzhi;
        }
        console.log(route);
        route_g = route;

        //绘制路径
        // for (var key1 in route) {
        //     trans1 = d3.select("#cluster" + key1.toString()).attr("transform");
        //     console.log(trans1);
        //     c1 = trans1.substring(10).split(',')
        //     x1 = c1[0]
        //     y1 = c1[1]
        //     yl = y1.length
        //     y1 = c1[1].substring(0, yl - 1)
        //     console.log(x1);
        //     console.log(y1);
        //     for (var key2 in route) {
        //         trans2 = d3.select("#cluster" + key2.toString()).attr("transform");
        //         console.log(trans2);
        //         c2 = trans2.substring(10).split(',')
        //         x2 = c2[0]
        //         y2 = c2[1]
        //         yl = y2.length
        //         y2 = c2[1].substring(0, yl - 1)
        //         console.log(x2);
        //         console.log(y2);
        //         console.log("一条route");
        //
        //
        //         var dataset = {
        //             source: {x: parseInt(x1), y: parseInt(y1)},
        //             target: {x: parseInt(x2), y: parseInt(y2)}
        //         };
        //         var diagonal = d3.svg.diagonal();
        //         svg1.append("path")
        //             .attr("d", diagonal(dataset))
        //             .attr("id", "route")
        //             .attr("fill", "none")
        //             .attr("stroke", "blue")
        //             .attr("stroke-width", 7);
        //     }
        // }

    }

    //展示初始rank
    function draw_rank_init(result, pid, data) {
        // console.log("draw_rank_init");
        var hang = result_list.length;
        result_list.push(result);
        feedback_list[hang + 1] = [];
        console.log("feedback_list")
        console.log(feedback_list)
        //---------------------------------------------------------------------------------------------------
        //新建rank_svg
        var rank_svg = new_rank_svg();

        //绘制run
        draw_run(rank_svg, pid, result);

        //绘制transform
        draw_transform(rank_svg);

        //绘制图片
        draw_image(rank_svg, result, data);

        //历史反馈
        // draw_history(rank_svg, result);

        //历史反馈、传播路径
        // draw_feedback_list(rank_svg, data);


        // //---------------------------------------------------------------------------------------------------
        //新建compression_svg
        var compression_svg = new_compression_svg();

        //绘制压缩图片
        draw_compression(compression_svg, result, hang);

        //连线
        // if (result_list.length > 1) {
        //     //与上一个rank连线
        //     draw_relation(compression_svg, result_list, hang);
        // }
        // //---------------------------------------------------------------------------------------------------

    }

    // //--------------------------------------------------------------------------------------------------------

    //rank svg新建
    function new_rank_svg() {
        hang = result_list.length;
        var svg = d3.select("body")
            .select("#Pic_")
            .select("#Pic_parameter")
            .append("svg")
            .attr("id", "rank" + hang.toString())
            .attr("width", picture_path_list.length * (image_w + jiange) + chushi)
            .attr("height", 120);
        return svg;
    }

    //run图标绘制
    function draw_run(svg, pid, result) {
        svg.append("svg:image")
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
                rectaAll = svg.selectAll(".add_rect")
                    .attr("x", function () {
                        l_index.push(result[parseInt(d3.select(this).attr("index"))]);
                        // console.log(d3.select(this).attr("label"));
                        Yl.push(parseFloat(d3.select(this).attr("label")));
                        return d3.select(this).attr("x");
                    });
                dict = {"l_index": l_index, "Yl": Yl}
                console.log("dict");
                console.log(dict);
                $.ajax({
                    type: 'POST',
                    url: '../graph_propagation/',
                    dataType: "json",
                    data: {
                        "pid": JSON.stringify(pid),
                        "dict": JSON.stringify(dict),
                    },
                    async: true,
                    success: function (data) {
                        data = JSON.parse(data);
                        console.log(data)
                        result = data["result"];
                        // draw_rank(result, pid, ci_list);
                        // pre_index = result_list.length - 2;
                        // pre_result = result_list[pre_index];
                        //更新overview
                        $.ajax({
                            type: 'POST',
                            url: '../overview_update/',
                            dataType: "json",
                            data: {
                                // "pre_result": JSON.stringify(pre_result),
                                "new_result": JSON.stringify(result),
                                "dict": JSON.stringify(dict),
                                "pid": JSON.stringify(pid),
                            },
                            async: true,
                            success: function (data) {
                                data = JSON.parse(data);
                                console.log("chonghui");
                                console.log(data);
                                // console.log(data);
                                d3.selectAll(".cluster_index").remove();
                                show5(data, H);
                                draw_rank(data, pid, result);
                            }
                        });
                    }
                });
            });
    }

    //transform图标绘制
    function draw_transform(svg) {
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
                tag = d3.select("#qiehuan");
                console.log(tag);
                if (tag["_groups"][0][0] === null) {
                    svg_new = svg.append("g")
                        .append("svg")
                        .attr("id", "qiehuan")
                        .attr("width", picture_path_list.length * (image_w + jiange) + chushi)
                        .attr("height", 140);
                    svg_new.append("rect")
                        .attr("width", picture_path_list.length * (image_w + jiange) + chushi)
                        .attr("height", 130)
                        .attr("x", chushi - 3)
                        .attr("y", kuang - 3)
                        .attr("fill", "white");
                    for (var index = 0; index < picture_path_list.length; index++) {
                        svg_new.append("svg:image")
                            .attr("xlink:href", function (d, i) {
                                // return "http://127.0.0.1:8000/static/data/image/compression/c_" + picture_path_list[index].substring(58,);
                                return "http://127.0.0.1:8000/static/data/image/color_image_W_5/color_" + picture_path_list[index].substring(58,);
                            })
                            .attr("x", function (d, i) {
                                return index * (12 + 3 + 3) + chushi;
                            })
                            .attr("y", function (d, i) {
                                return kuang;
                            })
                            .attr("image", picture_path_list[index])
                            .attr("width", 12)
                            .attr("height", 107)
                            .on("click", function () {
                                    tanchu = d3.select(".tanchu");
                                    console.log(tanchu);
                                    if (tanchu["_groups"][0][0] === null) {
                                        x = d3.select(this).attr("x");
                                        y = d3.select(this).attr("y");
                                        image = d3.select(this).attr("image")
                                        console.log(x);
                                        console.log(y);
                                        svg_new.append("rect")
                                            .attr("x", parseInt(x) + 15)
                                            .attr("y", parseInt(y))
                                            .attr("class", "tanchu")
                                            .attr("width", 90)
                                            .attr("height", 110)
                                            .attr("rx", 5)
                                            .attr("stroke", "black")
                                            .attr("stroke-width", "3px")
                                            .attr("fill", "white")
                                        svg_new.append("image")
                                            .attr("xlink:href", function (d, i) {
                                                return image;
                                            })
                                            .attr("x", parseInt(x) + 15 + 7)
                                            .attr("y", parseInt(y) + 5)
                                            .attr("class", "tanchu")
                                            .attr("width", 50)
                                            .attr("height", 100)
                                            .attr("rx", 5)
                                        svg_new.append("image")
                                            .attr("xlink:href", function (d, i) {
                                                return "http://127.0.0.1:8000/static/data/icon/same.png";
                                            })
                                            .attr("x", parseInt(x) + 15 + 7 + 55)
                                            .attr("y", parseInt(y) + 5)
                                            .attr("class", "tanchu")
                                            .attr("width", "20")
                                            .attr("height", "20")
                                            .on("click", function () {
                                                svg_new.append("circle")
                                                    .attr("cx", parseInt(x) + 6)
                                                    .attr("cy", parseInt(y) + 112)
                                                    .attr("r", 4)
                                                    .attr("fill", same)
                                                    .attr("stroke", "grey")
                                                    .attr("stroke-width", "1px")
                                            })
                                        svg_new.append("image")
                                            .attr("xlink:href", function (d, i) {
                                                return "http://127.0.0.1:8000/static/data/icon/similarity.png";
                                            })
                                            .attr("x", parseInt(x) + 15 + 7 + 54)
                                            .attr("y", parseInt(y) + 5 + 22)
                                            .attr("class", "tanchu")
                                            .attr("width", "20")
                                            .attr("height", "20")
                                            .on("click", function () {
                                                svg_new.append("circle")
                                                    .attr("cx", parseInt(x) + 6)
                                                    .attr("cy", parseInt(y) + 112)
                                                    .attr("r", 4)
                                                    .attr("fill", similarity)
                                                    .attr("stroke", "grey")
                                                    .attr("stroke-width", "1px")
                                            })
                                        svg_new.append("image")
                                            .attr("xlink:href", function (d, i) {
                                                return "http://127.0.0.1:8000/static/data/icon/dissimilarity.png";
                                            })
                                            .attr("x", parseInt(x) + 15 + 7 + 55 + 1)
                                            .attr("y", parseInt(y) + 5 + 22 + 22 + 2)
                                            .attr("class", "tanchu")
                                            .attr("width", "17")
                                            .attr("height", "17")
                                            .on("click", function () {
                                                svg_new.append("circle")
                                                    .attr("cx", parseInt(x) + 6)
                                                    .attr("cy", parseInt(y) + 112)
                                                    .attr("r", 4)
                                                    .attr("fill", dissimilarity)
                                                    .attr("stroke", "grey")
                                                    .attr("stroke-width", "1px")
                                            })

                                    } else {
                                        d3.selectAll(".tanchu").remove();
                                    }

                                    // tanchukuang(svg_new, x - 5, y + 5);
                                }
                            );

                    }


                } else {
                    d3.select("#qiehuan").remove();
                }
            });
    }

    function tanchukuang(svg1, x, y) {
        const w = 40;
        const h = 60;
        const radius = 10;
        const triangleL = 30;
        // const x = 50;
        // const y = 50;

        // var svg1 = d3.select("body")
        //     .select("#Pic_")
        //     .select("#Pic")
        //     .append("svg")
        //     .attr("width", 800)
        //     .attr("height", 800)
        //     .append("g")
        //     .attr("fill", "black")
        //     .attr("stroke", "black")
        //     .attr("stroke-width", "1px");

        var rect = svg1.append("path")
            .attr("d", rightRoundedRect(x, y, w, h, radius));

        function rightRoundedRect(x, y, width, height, radius) {
            return "M" + x + "," + y
                + "a" + radius + "," + radius + " 0 0 1 " + radius + "," + -radius
                + "h" + (width - radius)
                + "a" + radius + "," + radius + " 0 0 1 " + radius + "," + radius
                + "v" + (height - 2 * radius)
                + "a" + radius + "," + radius + " 0 0 1 " + -radius + "," + radius
                + "h" + (radius - width - 10)
                + "z";
        }

        var lines = [[x, y + h - triangleL - 10], [x - triangleL * 0.8, y + h - triangleL / 2 - 10], [x, y + h - 10]];
        var linePath = d3.line();
        svg1.append("path")
            .attr("d", linePath(lines))
            .attr("stroke", "black")
            .attr("stroke-width", "1px")
            .attr("fill", "none");

        var lines2 = [[x + 0.5, y + h - triangleL - 9.5], [x + 0.5, y + h - 10.8]];
        svg1.append("path")
            .attr("d", linePath(lines2))
            .attr("stroke", "white")
            .attr("stroke-width", "2.5px")
            .attr("fill", "none");
    }

    //图片、反馈按钮绘制
    //【标识】same/similarity/dissimilarity image.attr("index", index)
    //【标识】rect.attr("class", "add_rect").attr("index", index).attr("label", 1)
    //【标识】image.attr("cluster",lables[result[index]])
    //【标识】image.attr("image_path",picture_path_list[result[index]])
    function draw_image(svg, result, data) {
        picture_path_list = data["picture_path_list"]
        ci_list = data["ci_list"]
        // for (var index = 0; index < 20; index++) {
        for (var index = 0; index < picture_path_list.length; index++) {
            svg.append("svg:image")
                .attr("xlink:href", function (d, i) {
                    return picture_path_list[index];
                })
                .attr("id", "rank_image" + picture_path_list[index].substring(58, 77))
                .attr("x", function (d, i) {
                    return index * (image_w + jiange) + chushi;
                })
                .attr("y", function (d, i) {
                    return kuang;
                })
                .attr("index", index)
                .attr("cluster", lables[result[index]])
                .attr("image_path", picture_path_list[index])
                .attr("width", image_w)
                .attr("height", image_h)
            svg.append("svg:image")
                .attr("xlink:href", function (d, i) {
                    return "http://127.0.0.1:8000/static/data/icon/same.png";
                })
                .attr("x", function (d, i) {
                    return index * (image_w + jiange) + chushi;
                })
                .attr("y", function (d, i) {
                    return image_h + kuang;
                })
                .attr("image_id", picture_path_list[index].substring(58, 77))
                .attr("index", index)
                .attr("class", ci_list[index])
                .attr("id", function () {
                    // console.log(result[index]);
                    // console.log(picture_path_list[result[index]]);
                    return picture_path_list[index].substring(58, 77)
                })
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

                    //上下视图协同
                    ci_class = d3.select(this).attr("class");
                    image_id = d3.select(this).attr("image_id");
                    feedback_list[result_list.length].push(image_id);
                    imagepath = d3.select(this).attr("id");
                    class_status = d3.select("#cluster_rect" + ci_class.toString()).attr("class");
                    console.log("#cluster_rect" + ci_class.toString());
                    if (class_status == "hotrect_da") {
                        overview_click_draw_image(ci_class, data, result_list.length);
                    }
                    // console.log("#image_" + imagepath);
                    d3.select("#image_" + imagepath).attr("fill", same);

                    for (var key in feedback_list) {
                        console.log("开始画框框");
                        item = feedback_list[key];
                        console.log(item);
                        for (var i = 0; i < item.length; i++) {
                            console.log(item[i]);
                            d3.select("#raw_image_" + item[i]).attr("stroke-width", "3px");
                        }
                    }

                    //绘制传播路径


                    //在时空辅助视图中进行展示
                    var linear_time = d3.scaleLinear()
                        .domain([0, 307525])
                        .range([0, 480]); //time轴的比例尺
                    time_s = [103487, 74761, 74935, 54346];
                    s_num = parseInt(image_id.substring(8, 9));
                    c_num = parseInt(image_id.substring(6, 7));
                    s_time = 0;
                    for (var i = 0; i < s_num - 3; i++) {
                        s_time = s_time + time_s[i];
                    }
                    s_time = s_time + parseInt(image_id.substring(10, 16));
                    var time_space_svg = d3.select("body")
                        .select("#query_parameter")
                        .select("#overview")
                        .select("svg")
                    var camera_rect_x0 = 45;//camera轴rect元素的x坐标的起始值
                    var camera_space = 54;//camera轴元素的间隔
                    var drag = d3.drag()
                        .on("start", function (d) {
                            // console.log("拖曳开始");
                        })
                        .on("end", function (d) {
                            // console.log("拖曳结束");
                        })
                        .on("drag", function (d) {
                            d3.select(this)
                                .attr("x", d3.event.x)
                                .attr("y", d3.event.y);
                        });
                    time_space_svg.append("image")
                        .attr("xlink:href", function (d, i) {
                            return "http://127.0.0.1:8000/static/data/image/bounding_box_test/" + image_id + ".jpg";
                        })
                        .attr("x", camera_rect_x0 + camera_space * (c_num - 1) + (camera_space - 33) / 2)
                        .attr("y", 40 + linear_time(s_time))
                        .attr("width", 33)
                        .attr("height", 66)
                        .call(drag);
                });
            svg.append("svg:image")
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
                            return index * (image_w + jiange) + chushi;
                        })
                        .attr("y", function (d, i) {
                            return kuang;
                        })
                        .attr("class", "add_rect")
                        .attr("index", index)
                        .attr("label", 0.3)
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
    }

    //绘制上一次的选择
    function draw_history(svg, result) {
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

    // //--------------------------------------------------------------------------------------------------------
    function new_compression_svg() {
        var svg = d3.select("body")
            .select("#Pic_")
            .select("#compression")
            .append("svg")
            .attr("width", picture_path_list.length * (image_w + jiange) + chushi)
            .attr("height", 520);
        return svg;
    }

    function draw_compression(compression_svg, result, hang) {
        for (var index = 0; index < picture_path_list.length; index++) {
            compression_svg.append("svg:image")
                .attr("xlink:href", function (d, i) {
                    // return "http://127.0.0.1:8000/static/data/image/compression/c_" + picture_path_list[index].substring(58,);
                    return "http://127.0.0.1:8000/static/data/image/color_image_W_5/color_" + picture_path_list[index].substring(58,);
                })
                .attr("x", function (d, i) {
                    return index * (pixel_w + pixel_jiange + 3) + chushi;
                })
                .attr("y", function (d, i) {
                    return kuang;
                })
                .attr("width", 5)
                .attr("height", 50);
            compression_svg.append("svg:image")
                .attr("xlink:href", function (d, i) {
                    return "http://127.0.0.1:8000/static/data/image/color_block_image_5/color_" + picture_path_list[index].substring(58,);
                    // return "http://127.0.0.1:8000/static/data/image/color_image_W_5/color_" + picture_path_list[index].substring(58,);
                })
                .attr("x", function (d, i) {
                    return index * (pixel_w + pixel_jiange + 3) + chushi;
                })
                .attr("y", function (d, i) {
                    return kuang + 60;
                })
                .attr("width", 5)
                .attr("height", 50);
            compression_svg.append("svg:image")
                .attr("xlink:href", function (d, i) {
                    return "http://127.0.0.1:8000/static/data/image/compression/c_" + picture_path_list[index].substring(58,);
                    // return "http://127.0.0.1:8000/static/data/image/color_image_W_5/color_" + picture_path_list[index].substring(58,);
                })
                .attr("x", function (d, i) {
                    return index * (pixel_w + pixel_jiange + 3) + chushi;
                })
                .attr("y", function (d, i) {
                    return kuang + 120;
                })
                .attr("width", 5)
                .attr("height", 50);
            // compression_svg.append("text")
            //     .text(function () {
            //         return index;
            //     })
            //     .attr("fill", "grey")
            //     .attr("font-size", "5px")
            //     .attr("x", function (d, i) {
            //         return index * (pixel_w + pixel_jiange + 10) + chushi;
            //     })
            //     .attr("y", function (d, i) {
            //         return kuang + 55;
            //     })
            //     .attr("width", 5)
            //     .attr("height", 50);
        }
    }

    function draw_relation(compression_svg, result_list, hang) {
    }

    //点击overview中高亮
    // function overview_click_draw_raw_image(index, data) {
    //     var image_w = 30
    //     var image_h = 60
    //     var cluster_padding = 3
    //
    //     //overview的参数
    //     var padding = {top: 10, right: 50, bottom: 50, left: 50}
    //     //热力图颜色比例尺
    //     var scaleColor = d3.scaleLinear()
    //         .domain([1, 0])
    //         .range(["white", "green"]);
    //
    //
    //     //要可视化的信息
    //     var obj = data;
    //     cluster = obj.cluster
    //     center = obj.center
    //     bian = obj.bian
    //
    //     //比例尺
    //     var xAxisWidth = w1
    //     var yAxisWidth = h1
    //     x_min = d3.min(center, function (d) {
    //         return d[0];
    //     })
    //     x_max = d3.max(center, function (d) {
    //         return d[0];
    //     })
    //     y_min = d3.min(center, function (d) {
    //         return d[1];
    //     })
    //     y_max = d3.max(center, function (d) {
    //         return d[1];
    //     })
    //     var xlinear = d3.scaleLinear()
    //         .domain([x_min, x_max])
    //         .range([0 + padding.left, xAxisWidth - padding.right]);
    //     var ylinear = d3.scaleLinear()
    //         .domain([y_min, y_max])
    //         .range([0 + padding.top, yAxisWidth - padding.bottom]);
    //     var drag = d3.drag()
    //         .on("start", function (d) {
    //             // console.log("拖曳开始");
    //         })
    //         .on("end", function (d) {
    //             // console.log("拖曳结束");
    //         })
    //         .on("drag", function (d) {
    //             d3.select(this)
    //                 .attr("transform", "translate(" + d3.event.x + "," + d3.event.y + ")");
    //         });
    //
    //
    //     //删掉原来的"g"
    //     svg1.select("#cluster" + index.toString()).remove()
    //
    //     //绘制新的"g"
    //     svg1
    //         .append("g")
    //         .attr("id", function () {
    //             return "cluster" + index.toString();
    //         })
    //         .style("width", function () {
    //             return bian[index] * 20;
    //         })
    //         .style("height", function (d, i) {
    //             return bian[index] * 20;
    //         })
    //         .attr("transform", function (d, i) {
    //             return "translate(" + xlinear(center[index][0]) + "," + ylinear(center[index][1]) + ")";
    //         })
    //         .call(drag);
    //
    //
    //     image_path_list = cluster[index][0]
    //     bian_list = cluster[index][1]
    //     rank_list = cluster[index][3]
    //     c_number = rank_list.length
    //
    //     //绘制新的边框"rect"
    //     d3.select("#cluster" + index.toString())
    //         .append("rect")
    //         .attr("id", function () {
    //             return "cluster_rect" + index.toString();
    //         })
    //         .attr("transform", function (d, i) {
    //             return "translate(" + 0 + "," + 0 + ")";
    //         })
    //         .attr("class", "image")
    //         .attr("width", bian[index] * image_h + 2 * cluster_padding)
    //         .attr("height", bian[index] * image_h + 2 * cluster_padding)
    //         .attr("fill", "rgba(255,0,0,0)")
    //         .attr("stroke", "black")
    //         .on("click", function () {
    //             // console.log("变image:click cluster rect");
    //             click_index = d3.select(this).attr("id").substring(12,);
    //             click_index = parseInt(click_index);
    //             class_status = d3.select(this).attr("class")
    //             // console.log(class_status);
    //             if (class_status == "hotrect") {
    //                 //    绘制image
    //                 overview_click_draw_image(click_index, data);
    //             } else if (class_status == "image") {
    //                 //    绘制hotrect
    //                 overview_click_draw_hotrect(cluster, click_index);
    //             }
    //         });
    //     //填充image
    //     for (var k = 0; k < rank_list.length; k++) {
    //         d3.select("#cluster" + index.toString())
    //             .append("svg:image")
    //             .attr("xlink:href", function () {
    //                 return image_path_list[k];
    //             })
    //             .attr("x", function () {
    //                 return image_w * parseInt(k % bian_list) + cluster_padding;
    //             })
    //             .attr("y", function () {
    //                 return image_h * parseInt(k / bian_list) + cluster_padding;
    //             })
    //             .attr("width", image_w)
    //             .attr("height", image_h);
    //     }
    //     for (var k = 0; k < rank_list.length; k++) {
    //         d3.select("#cluster" + index.toString())
    //             .append("rect")
    //             .attr("fill", "rgba(255,0,0,0)")
    //             .attr("stroke", dissimilarity)
    //             .attr("stroke-width", "0px")
    //             .attr("x", function () {
    //                 return image_w * parseInt(k % bian_list) + cluster_padding;
    //             })
    //             .attr("y", function () {
    //                 return image_h * parseInt(k / bian_list) + cluster_padding;
    //             })
    //             .attr("id", "image_" + image_path_list[k].substring(58, 77))
    //             .attr("width", image_w)
    //             .attr("height", image_h);
    //
    //     }
    //
    //     function overview_click_draw_hotrect(cluster, index) {
    //         var hot_rect_s = 10
    //         var cluster_padding = 3
    //
    //
    //         //删掉原来的"g"
    //         svg1.select("#cluster" + index.toString()).remove()
    //
    //         //绘制新的"g"
    //         svg1
    //             .append("g")
    //             .attr("id", function () {
    //                 return "cluster" + index.toString();
    //             })
    //             .style("width", function () {
    //                 return bian[index] * 20;
    //             })
    //             .style("height", function (d, i) {
    //                 return bian[index] * 20;
    //             })
    //             .attr("transform", function (d, i) {
    //                 return "translate(" + xlinear(center[index][0]) + "," + ylinear(center[index][1]) + ")";
    //             })
    //             .call(drag);
    //
    //         image_path_list = cluster[index][0]
    //         bian_list = cluster[index][1]
    //         rank_list = cluster[index][3]
    //         c_number = rank_list.length
    //
    //         //绘制新的边框"rect"
    //         d3.select("#cluster" + index.toString())
    //             .append("rect")
    //             .attr("id", function () {
    //                 return "cluster_rect" + index.toString();
    //             })
    //             .attr("transform", function (d, i) {
    //                 return "translate(" + 0 + "," + 0 + ")";
    //             })
    //             .attr("class", "hotrect")
    //             .attr("width", bian[index] * hot_rect_s + 2 * cluster_padding)
    //             .attr("height", function () {
    //                 if (c_number % bian[index] == 0)
    //                     return parseInt(c_number / bian[index]) * hot_rect_s + 2 * cluster_padding;
    //                 if (c_number % bian[index] > 0)
    //                     return (parseInt(c_number / bian[index]) + 1) * hot_rect_s + 2 * cluster_padding;
    //             })
    //             .attr("fill", "rgb(255,0,0,0)")
    //             .attr("stroke", "black")
    //             .on("click", function () {
    //                 // console.log("上");
    //                 // console.log("变hotrect:click cluster rect");
    //                 click_index = d3.select(this).attr("id").substring(12,);
    //                 click_index = parseInt(click_index);
    //                 class_status = d3.select(this).attr("class")
    //                 // console.log(class_status);
    //                 if (class_status == "hotrect") {
    //                     //    绘制image
    //                     overview_click_draw_image(click_index, data);
    //                 } else if (class_status == "image") {
    //                     //    绘制hotrect
    //                     overview_click_draw_hotrect(cluster, click_index);
    //                 }
    //             });
    //         //填充hotrect
    //         for (var k = 0; k < rank_list.length; k++) {
    //             d3.select("#cluster" + index.toString())
    //                 .append("rect")
    //                 .attr("x", function () {
    //                     return hot_rect_s * (k % bian_list) + cluster_padding;
    //                 })
    //                 .attr("y", function () {
    //                     return parseInt(k / bian_list) * hot_rect_s + cluster_padding;
    //                 })
    //                 .attr("width", hot_rect_s)
    //                 .attr("height", hot_rect_s)
    //                 .attr("fill", function (d, i) {
    //                     return scaleColor(rank_list[k] / 500);
    //                 })
    //                 .attr("stroke", function () {
    //                     return "black";
    //                 });
    //         }
    //     }
    // }

    function overview_click_draw_raw_image(index, data, hang, hang_) {
        var image_w = 30
        var image_h = 60
        var cluster_padding = 10
        var pixel_w = 30
        var pixel_h = pixel_w * 2
        var lsft_chushi = 2
        var top_chushi = 3
        var liangliang = 25

        //overview的参数
        var padding = {top: 10, right: 50, bottom: 50, left: 50}
        //热力图颜色比例尺
        var scaleColor = d3.scaleLinear()
            .domain([1, 0])
            .range(["white", "green"]);


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

        //关闭按钮
        function rightRoundedRect(x, y, width, height, radius) {
            return "M" + x + "," + y
                + "h" + (width - radius)
                + "a" + radius + "," + radius + " 0 0 1 " + radius + "," + radius
                + "v" + (height - 2 * radius)
                + "a" + radius + "," + radius + " 0 0 1 " + -radius + "," + radius
                + "h" + (radius - width)
                + "z";
        }

        d3.select("#cluster" + index.toString())
            .append("path")
            .attr("d", rightRoundedRect(bian_list * (pixel_w + liangliang) + cluster_padding - 2 + lsft_chushi + 2, 5, 13, 13, 3))
            .attr("fill", "#d78d8d");

        d3.select("#cluster" + index.toString())
            .append("image")
            .attr("xlink:href", function (d, i) {
                return "http://127.0.0.1:8000/static/data/icon/close.svg";
            })
            .attr("class", function () {
                return index.toString();
            })
            .attr("status", function () {
                return "image";
            })
            .attr("x", function (d, i) {
                return bian_list * (pixel_w + liangliang) + cluster_padding - 2 + lsft_chushi + 2.5;
            })
            .attr("y", function (d, i) {
                return 6;
            })
            .attr("width", "12")
            .attr("height", "12")
            .attr("index", index)
            .on("click", function () {
                // console.log("close");
                click_index = d3.select(this).attr("class");
                click_index = parseInt(click_index);
                class_status = d3.select(this).attr("status")
                // console.log(class_status);
                if (class_status == "hotrect_da") {
                    //    绘制image
                    overview_click_draw_image(click_index, data, result_list.length);
                } else if (class_status == "image") {
                    //    绘制hotrect
                    overview_click_draw_image_hang_(click_index, data, result_list.length, hang_);
                }
                for (var key in feedback_list) {
                    item = feedback_list[key];
                    for (var i = 0; i < item.length; i++) {
                        d3.select("#image_" + item[i]).attr("fill", same);
                    }
                }
            });
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
            .attr("width", bian_list * (pixel_w + liangliang) + cluster_padding - 2 + lsft_chushi + 2)
            .attr("height", Math.ceil(c_number / bian[index]) * (pixel_h + 4) + 2 * cluster_padding + top_chushi)
            // .attr("fill", "rgba(255,0,0,0)")
            .attr("fill", "#efecec")
            .attr("stroke", "#efecec")
            .attr("stroke-width", "2px")
            .attr("rx", 5)
            .on("click", function () {
                // console.log("变image:click cluster rect");
                click_index = d3.select(this).attr("id").substring(12,);
                click_index = parseInt(click_index);
                class_status = d3.select(this).attr("class")
                // console.log(class_status);
                if (class_status == "hotrect_da") {
                    //    绘制image
                    overview_click_draw_image(click_index, data, result_list.length);
                } else if (class_status == "image") {
                    //    绘制hotrect
                    overview_click_draw_image_hang_(click_index, data, result_list.length, hang_);
                }
            });
        d3.select("#cluster" + index.toString())
            .append("circle")
            .attr("fill", function () {
                console.log(hang_);
                console.log("hang_");
                if (hang == hang_) {
                    return "#f8c309";
                } else {
                    return "#828080";
                }

            })
            .attr("stroke", "#828080")
            .attr("stroke-width", "0px")
            .attr("cx", function () {
                return 0;
            })
            .attr("cy", function () {
                return 0;
            })
            .attr("r", 7);

        d3.select("#cluster" + index.toString())
            .append("text")
            .attr("font-family", "sans-serif")
            .attr("font-size", "11px")
            .attr("fill", "white")
            .text(hang_)
            .attr("x", function () {
                return -3;
            })
            .attr("y", function () {
                return 4;
            });

        //填充image
        for (var k = 0; k < rank_list.length; k++) {
            d3.select("#cluster" + index.toString())
                .append("svg:image")
                .attr("xlink:href", function () {
                    return image_path_list[k];
                    // return image_path_list[k];
                })
                .attr("x", function () {
                    return (pixel_w + liangliang) * parseInt(k % bian_list) + cluster_padding + lsft_chushi;
                })
                .attr("y", function () {
                    return (pixel_h + 5) * parseInt(k / bian_list) + cluster_padding + top_chushi;
                })
                .attr("width", pixel_w)
                .attr("height", pixel_h);
            d3.select("#cluster" + index.toString())
                .append("rect")
                .attr("id", "raw_image_" + image_path_list[k].substring(58, 77))
                .attr("x", function () {
                    return (pixel_w + liangliang) * parseInt(k % bian_list) + cluster_padding + lsft_chushi;
                })
                .attr("y", function () {
                    return (pixel_h + 5) * parseInt(k / bian_list) + cluster_padding + top_chushi;
                })
                .attr("width", pixel_w)
                .attr("height", pixel_h)
                .attr("stroke", same)
                .attr("fill", "rgba(255,0,0,0)")
                .attr("stroke-width", "0px");
            d3.select("#cluster" + index.toString())
                .append("svg:image")
                .attr("xlink:href", function () {
                    return "http://127.0.0.1:8000/static/data/icon/same.png";
                    // return image_path_list[k];
                })
                .attr("class", image_path_list[k].substring(58, 77))
                .attr("x", function () {
                    return (pixel_w + liangliang) * parseInt(k % bian_list) + cluster_padding + lsft_chushi + pixel_w + 2;
                })
                .attr("y", function () {
                    return (pixel_h + 5) * parseInt(k / bian_list) + cluster_padding + top_chushi;
                })
                .attr("width", 17)
                .attr("height", 17)
                .on("click", function () {
                    //
                    iplk = d3.select(this).attr("class");
                    d3.select("#raw_image_" + iplk).attr("stroke-width", "3px");
                    feedback_list[result_list.length].push(iplk);
                    //
                    console.log("zhelizhelizheli");
                    hang = result_list.length;
                    console.log(hang);
                    console.log("zhelizheli");
                    console.log(iplk);
                    x = d3.select("#rank" + hang.toString()).select("#rank_image" + iplk).attr("x");
                    y = d3.select("#rank" + hang.toString()).select("#rank_image" + iplk).attr("y");
                    index = d3.select("#rank" + hang.toString()).select("#rank_image" + iplk).attr("index");
                    console.log(index);
                    d3.select("#rank" + hang.toString())
                        .append("rect")
                        .attr("x", function () {
                            return x;
                        })
                        .attr("y", function (d, i) {
                            return y;
                        })
                        .attr("class", "add_rect")
                        .attr("index", index)
                        .attr("label", 1)
                        .attr("width", 50)
                        .attr("height", 100)
                        .attr("fill", "rgba(255,0,0,0)")
                        .attr("stroke", function () {
                            return same;
                        })
                        .attr("stroke-width", "5px");
                });
            d3.select("#cluster" + index.toString())
                .append("svg:image")
                .attr("xlink:href", function () {
                    return "http://127.0.0.1:8000/static/data/icon/similarity.png";
                    // return image_path_list[k];
                })
                .attr("x", function () {
                    return (pixel_w + liangliang) * parseInt(k % bian_list) + cluster_padding + lsft_chushi + pixel_w + 2;
                })
                .attr("y", function () {
                    return (pixel_h + 5) * parseInt(k / bian_list) + cluster_padding + top_chushi + 15;
                })
                .attr("width", 15)
                .attr("height", 15)
                .on("click", function () {

                });
            d3.select("#cluster" + index.toString())
                .append("svg:image")
                .attr("xlink:href", function () {
                    return "http://127.0.0.1:8000/static/data/icon/dissimilarity.png";
                    // return image_path_list[k];
                })
                .attr("x", function () {
                    return (pixel_w + liangliang) * parseInt(k % bian_list) + cluster_padding + lsft_chushi + pixel_w + 1 + 2;
                })
                .attr("y", function () {
                    return (pixel_h + 5) * parseInt(k / bian_list) + cluster_padding + top_chushi + 30;
                })
                .attr("width", 13)
                .attr("height", 13)
                .on("click", function () {

                });
        }

        for (var key in feedback_list) {
            console.log("开始画框框");
            item = feedback_list[key];
            console.log(item);
            for (var i = 0; i < item.length; i++) {
                console.log(item[i]);
                d3.select("#raw_image_" + item[i]).attr("stroke-width", "3px");
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
                .attr("class", "hotrect_da")
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
                    // console.log("上");
                    // console.log("变hotrect:click cluster rect");
                    click_index = d3.select(this).attr("id").substring(12,);
                    click_index = parseInt(click_index);
                    class_status = d3.select(this).attr("class")
                    hang_ = d3.select(this).attr("hang");
                    // console.log(class_status);
                    if (class_status == "hotrect_da") {
                        //    绘制image
                        overview_click_draw_image_hang_(click_index, data, result_list.length, hang_);
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
                    .attr("index_num", function () {
                        return index.toString();
                    })
                    .attr("rect_num", function () {
                        return rank_list[k];
                    })
                    .attr("id", function () {
                        return "overview" + image_path_list[k].substring(58, 77);
                    })
                    .attr("class", "hotrect")
                    .attr("width", hot_rect_s)
                    .attr("height", hot_rect_s)
                    .attr("fill", function (d, i) {
                        return scaleColor(rank_list[k] / H);
                    })
                    .attr("stroke", function () {
                        return "black";
                    });
            }
        }
    }

    function overview_click_draw_image(index, data, hang) {
        var image_w = 30
        var image_h = 60
        var cluster_padding = 3
        var pixel_w = 5
        var pixel_h = pixel_w * 10
        var lsft_chushi = 2
        var top_chushi = 3

        //overview的参数
        var padding = {top: 10, right: 50, bottom: 50, left: 50}
        //热力图颜色比例尺
        var scaleColor = d3.scaleLinear()
            .domain([1, 0])
            .range(["white", "green"]);


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
        function rightRoundedRect(x, y, width, height, radius) {
            return "M" + x + "," + y
                + "h" + (width - radius)
                + "a" + radius + "," + radius + " 0 0 1 " + radius + "," + radius
                + "v" + (height - 2 * radius)
                + "a" + radius + "," + radius + " 0 0 1 " + -radius + "," + radius
                + "h" + (radius - width)
                + "z";
        }

        d3.select("#cluster" + index.toString())
            .append("path")
            .attr("d", rightRoundedRect(c_number * (pixel_w + 2) + 2 * cluster_padding - 2 + lsft_chushi + 2, 5, 13, 13, 3))
            .attr("fill", "#d78d8d");
        //绘制flag
        // d3.select("#cluster" + index.toString())
        //     .append("image")
        //     .attr("xlink:href", function (d, i) {
        //         return "http://127.0.0.1:8000/static/data/icon/flag.svg";
        //     })
        //     .attr("x", function (d, i) {
        //         // return 5;
        //         return c_number * (pixel_w + 2) + 2 * cluster_padding - 2 + lsft_chushi +4;
        //     })
        //     .attr("y", function (d, i) {
        //         return 20;
        //     })
        //     .attr("width", "17")
        //     .attr("height", "17")
        //     .attr("index", index)
        //     .on("click", function () {
        //
        //     });
        d3.select("#cluster" + index.toString())
            .append("image")
            .attr("xlink:href", function (d, i) {
                return "http://127.0.0.1:8000/static/data/icon/more_.svg";
            })
            .attr("id", function () {
                return "cluster_rect" + index.toString();
            })
            .attr("hang", hang)
            .attr("x", function (d, i) {
                return c_number * (pixel_w + 2) + 2 * cluster_padding - 2 + lsft_chushi + 2;
            })
            .attr("y", function (d, i) {
                return 50;
            })
            .attr("width", "15")
            .attr("height", "15")
            .attr("index", index)
            .on("click", function () {
                click_index = d3.select(this).attr("id").substring(12,);
                hang_ = d3.select(this).attr("hang");
                console.log("initial hang");
                console.log(hang_);
                click_index = parseInt(click_index);

                overview_click_draw_raw_image(click_index, data, result_list.length, hang_);
            });
        d3.select("#cluster" + index.toString())
            .append("image")
            .attr("xlink:href", function (d, i) {
                return "http://127.0.0.1:8000/static/data/icon/close.svg";
            })
            .attr("class", function () {
                return index.toString();
            })
            .attr("status", function () {
                return "color";
            })
            .attr("x", function (d, i) {
                return c_number * (pixel_w + 2) + 2 * cluster_padding - 2 + lsft_chushi + 2.5;
            })
            .attr("y", function (d, i) {
                return 6;
            })
            .attr("width", "12")
            .attr("height", "12")
            .attr("index", index)
            .on("click", function () {
                // console.log("变image:click cluster rect");
                click_index = d3.select(this).attr("class");
                click_index = parseInt(click_index);
                class_status = d3.select(this).attr("status")
                // console.log(class_status);
                if (class_status == "image") {
                    //    绘制image
                    overview_click_draw_image(click_index, data, result_list.length);
                } else if (class_status == "color") {
                    //    绘制hotrect
                    overview_click_draw_hotrect(cluster, click_index);
                }
                for (var key in feedback_list) {
                    item = feedback_list[key];
                    for (var i = 0; i < item.length; i++) {
                        d3.select("#image_" + item[i]).attr("fill", same);
                    }
                }
            });

        d3.select("#cluster" + index.toString())
            .append("rect")
            .attr("id", function () {
                return "cluster_rect" + index.toString();
            })
            .attr("transform", function (d, i) {
                return "translate(" + 0 + "," + 0 + ")";
            })
            .attr("class", "image")
            .attr("width", c_number * (pixel_w + 2) + 2 * cluster_padding - 2 + lsft_chushi + 2)
            .attr("height", pixel_h + 2 * cluster_padding + 7 + top_chushi)
            .attr("fill", "rgb(255,255,255)")
            .attr("stroke", "#bfbfbf")
            .attr("stroke-width", "2px")
            .attr("rx", 5)
            .on("click", function () {
                // console.log("变image:click cluster rect");
                click_index = d3.select(this).attr("id").substring(12,);
                click_index = parseInt(click_index);
                class_status = d3.select(this).attr("class")
                // console.log(class_status);
                if (class_status == "hotrect_da") {
                    //    绘制image
                    overview_click_draw_image(click_index, data, result_list.length);
                } else if (class_status == "image") {
                    //    绘制hotrect
                    overview_click_draw_hotrect(cluster, click_index);
                }
            });
        d3.select("#cluster" + index.toString())
            .append("circle")
            .attr("fill", "#f8c309")
            .attr("stroke", "#828080")
            .attr("stroke-width", "0px")
            .attr("cx", function () {
                return 0;
            })
            .attr("cy", function () {
                return 0;
            })
            .attr("r", 7);

        d3.select("#cluster" + index.toString())
            .append("text")
            .attr("font-family", "sans-serif")
            .attr("font-size", "11px")
            .attr("fill", "white")
            .text(hang)
            .attr("x", function () {
                return -3;
            })
            .attr("y", function () {
                return 4;
            });

        //填充image
        for (var k = 0; k < rank_list.length; k++) {
            d3.select("#cluster" + index.toString())
                .append("svg:image")
                .attr("xlink:href", function () {
                    return "http://127.0.0.1:8000/static/data/image/color_image_W_5/color_" + image_path_list[k].substring(58,);
                    // return image_path_list[k];
                })
                .attr("x", function () {
                    return (pixel_w + 2) * parseInt(k) + cluster_padding + lsft_chushi;
                })
                .attr("y", function () {
                    return pixel_h * parseInt(0 / bian_list) + cluster_padding + top_chushi;
                })
                .attr("width", pixel_w)
                .attr("height", pixel_h);
        }
        for (var k = 0; k < rank_list.length; k++) {
            d3.select("#cluster" + index.toString())
                .append("circle")
                .attr("fill", "#f8da73")
                .attr("stroke", "#828080")
                // .attr("stroke-width", "0px")
                .attr("cx", function () {
                    return (pixel_w + 2) * parseInt(k) + cluster_padding + pixel_w / 2 + lsft_chushi;
                })
                .attr("cy", function () {
                    return pixel_h * parseInt(0 / bian_list) + cluster_padding + pixel_h + 5 + top_chushi;
                })
                .attr("class", "click_circle")
                .attr("id", "image_" + image_path_list[k].substring(58, 77))
                .attr("r", 2.5);

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
                .attr("class", "hotrect_da")
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
                    // console.log("上");
                    // console.log("变hotrect:click cluster rect");
                    click_index = d3.select(this).attr("id").substring(12,);
                    click_index = parseInt(click_index);
                    class_status = d3.select(this).attr("class")
                    // console.log(class_status);
                    if (class_status == "hotrect") {
                        //    绘制image
                        overview_click_draw_image(click_index, data, result_list.length);
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
                    .attr("index_num", function () {
                        return index.toString();
                    })
                    .attr("rect_num", function () {
                        return rank_list[k];
                    })
                    .attr("id", function () {
                        return "overview" + image_path_list[k].substring(58, 77);
                    })
                    .attr("class", "hotrect")
                    .attr("width", hot_rect_s)
                    .attr("height", hot_rect_s)
                    .attr("fill", function (d, i) {
                        return scaleColor(rank_list[k] / H);
                    })
                    .attr("stroke", function () {
                        return "black";
                    });
            }
        }
    }

    function overview_click_draw_image_hang_(index, data, hang, hang_) {
        var image_w = 30
        var image_h = 60
        var cluster_padding = 3
        var pixel_w = 5
        var pixel_h = pixel_w * 10
        var lsft_chushi = 2
        var top_chushi = 3

        //overview的参数
        var padding = {top: 10, right: 50, bottom: 50, left: 50}
        //热力图颜色比例尺
        var scaleColor = d3.scaleLinear()
            .domain([1, 0])
            .range(["white", "green"]);


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
        function rightRoundedRect(x, y, width, height, radius) {
            return "M" + x + "," + y
                + "h" + (width - radius)
                + "a" + radius + "," + radius + " 0 0 1 " + radius + "," + radius
                + "v" + (height - 2 * radius)
                + "a" + radius + "," + radius + " 0 0 1 " + -radius + "," + radius
                + "h" + (radius - width)
                + "z";
        }

        d3.select("#cluster" + index.toString())
            .append("path")
            .attr("d", rightRoundedRect(c_number * (pixel_w + 2) + 2 * cluster_padding - 2 + lsft_chushi + 2, 5, 13, 13, 3))
            .attr("fill", "#d78d8d");

        d3.select("#cluster" + index.toString())
            .append("image")
            .attr("xlink:href", function (d, i) {
                return "http://127.0.0.1:8000/static/data/icon/more_.svg";
            })
            .attr("id", function () {
                return "cluster_rect" + index.toString();
            })
            .attr("hang", hang_)
            .attr("x", function (d, i) {
                return c_number * (pixel_w + 2) + 2 * cluster_padding - 2 + lsft_chushi + 2;
            })
            .attr("y", function (d, i) {
                return 50;
            })
            .attr("width", "15")
            .attr("height", "15")
            .attr("index", index)
            .on("click", function () {
                click_index = d3.select(this).attr("id").substring(12,);
                hang_ = d3.select(this).attr("hang");
                click_index = parseInt(click_index);
                console.log("这里这里");
                console.log(hang_);
                overview_click_draw_raw_image(click_index, data, result_list.length, hang_);
            });
        d3.select("#cluster" + index.toString())
            .append("image")
            .attr("xlink:href", function (d, i) {
                return "http://127.0.0.1:8000/static/data/icon/close.svg";
            })
            .attr("class", function () {
                return index.toString();
            })
            .attr("status", function () {
                return "color";
            })
            .attr("x", function (d, i) {
                return c_number * (pixel_w + 2) + 2 * cluster_padding - 2 + lsft_chushi + 2.5;
            })
            .attr("y", function (d, i) {
                return 6;
            })
            .attr("width", "12")
            .attr("height", "12")
            .attr("index", index)
            .on("click", function () {
                // console.log("变image:click cluster rect");
                click_index = d3.select(this).attr("class");
                click_index = parseInt(click_index);
                class_status = d3.select(this).attr("status")
                // console.log(class_status);
                if (class_status == "image") {
                    //    绘制image
                    overview_click_draw_image_hang_(click_index, data, result_list.length, hang_);
                } else if (class_status == "color") {
                    //    绘制hotrect
                    overview_click_draw_hotrect(cluster, click_index);
                }
                for (var key in feedback_list) {
                    item = feedback_list[key];
                    for (var i = 0; i < item.length; i++) {
                        d3.select("#image_" + item[i]).attr("fill", same);
                    }
                }
            });

        d3.select("#cluster" + index.toString())
            .append("rect")
            .attr("id", function () {
                return "cluster_rect" + index.toString();
            })
            .attr("transform", function (d, i) {
                return "translate(" + 0 + "," + 0 + ")";
            })
            .attr("class", "image")
            .attr("width", c_number * (pixel_w + 2) + 2 * cluster_padding - 2 + lsft_chushi + 2)
            .attr("height", pixel_h + 2 * cluster_padding + 7 + top_chushi)
            .attr("fill", "rgb(255,255,255)")
            .attr("stroke", "#bfbfbf")
            .attr("stroke-width", "2px")
            .attr("rx", 5)
            .on("click", function () {
                // console.log("变image:click cluster rect");
                click_index = d3.select(this).attr("id").substring(12,);
                click_index = parseInt(click_index);
                class_status = d3.select(this).attr("class")
                // console.log(class_status);
                if (class_status == "hotrect_da") {
                    //    绘制image
                    overview_click_draw_image_hang_(click_index, data, result_list.length, hang_);
                } else if (class_status == "image") {
                    //    绘制hotrect
                    overview_click_draw_hotrect(cluster, click_index);
                }
            });
        d3.select("#cluster" + index.toString())
            .append("circle")
            .attr("fill", function () {
                console.log(hang_);
                console.log("hang_");
                if (hang == hang_) {
                    return "#f8c309";
                } else {
                    return "#828080";
                }

            })
            .attr("stroke", "#828080")
            .attr("stroke-width", "0px")
            .attr("cx", function () {
                return 0;
            })
            .attr("cy", function () {
                return 0;
            })
            .attr("r", 7);

        d3.select("#cluster" + index.toString())
            .append("text")
            .attr("font-family", "sans-serif")
            .attr("font-size", "11px")
            .attr("fill", "white")
            .text(hang_)
            .attr("x", function () {
                return -3;
            })
            .attr("y", function () {
                return 4;
            });

        //填充image
        for (var k = 0; k < rank_list.length; k++) {
            d3.select("#cluster" + index.toString())
                .append("svg:image")
                .attr("xlink:href", function () {
                    return "http://127.0.0.1:8000/static/data/image/color_image_W_5/color_" + image_path_list[k].substring(58,);
                    // return image_path_list[k];
                })
                .attr("x", function () {
                    return (pixel_w + 2) * parseInt(k) + cluster_padding + lsft_chushi;
                })
                .attr("y", function () {
                    return pixel_h * parseInt(0 / bian_list) + cluster_padding + top_chushi;
                })
                .attr("width", pixel_w)
                .attr("height", pixel_h);
        }
        for (var k = 0; k < rank_list.length; k++) {
            d3.select("#cluster" + index.toString())
                .append("circle")
                .attr("fill", "#f8da73")
                .attr("stroke", "#828080")
                // .attr("stroke-width", "0px")
                .attr("cx", function () {
                    return (pixel_w + 2) * parseInt(k) + cluster_padding + pixel_w / 2 + lsft_chushi;
                })
                .attr("cy", function () {
                    return pixel_h * parseInt(0 / bian_list) + cluster_padding + pixel_h + 5 + top_chushi;
                })
                .attr("class", "click_circle")
                .attr("id", "image_" + image_path_list[k].substring(58, 77))
                .attr("r", 2.5);

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
                .attr("class", "hotrect_da")
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
                    // console.log("上");
                    // console.log("变hotrect:click cluster rect");
                    click_index = d3.select(this).attr("id").substring(12,);
                    click_index = parseInt(click_index);
                    class_status = d3.select(this).attr("class")
                    // console.log(class_status);
                    if (class_status == "hotrect_da") {
                        //    绘制image
                        overview_click_draw_image(click_index, data, result_list.length);
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
                    .attr("index_num", function () {
                        return index.toString();
                    })
                    .attr("rect_num", function () {
                        return rank_list[k];
                    })
                    .attr("id", function () {
                        return "overview" + image_path_list[k].substring(58, 77);
                    })
                    .attr("width", hot_rect_s)
                    .attr("height", hot_rect_s)
                    .attr("fill", function (d, i) {
                        return scaleColor(rank_list[k] / H);
                    })
                    .attr("stroke", function () {
                        return "black";
                    });
            }
        }
    }

    function overview_click_draw_image_his(index, data, hang) {
        var image_w = 30
        var image_h = 60
        var cluster_padding = 3
        var pixel_w = 5
        var pixel_h = pixel_w * 10
        var lsft_chushi = 2
        var top_chushi = 3

        //overview的参数
        var padding = {top: 10, right: 50, bottom: 50, left: 50}
        //热力图颜色比例尺
        var scaleColor = d3.scaleLinear()
            .domain([1, 0])
            .range(["white", "green"]);


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
        function rightRoundedRect(x, y, width, height, radius) {
            return "M" + x + "," + y
                + "h" + (width - radius)
                + "a" + radius + "," + radius + " 0 0 1 " + radius + "," + radius
                + "v" + (height - 2 * radius)
                + "a" + radius + "," + radius + " 0 0 1 " + -radius + "," + radius
                + "h" + (radius - width)
                + "z";
        }

        d3.select("#cluster" + index.toString())
            .append("path")
            .attr("d", rightRoundedRect(c_number * (pixel_w + 2) + 2 * cluster_padding - 2 + lsft_chushi + 2, 5, 13, 13, 3))
            .attr("fill", "#d78d8d");
        //绘制flag
        // d3.select("#cluster" + index.toString())
        //     .append("image")
        //     .attr("xlink:href", function (d, i) {
        //         return "http://127.0.0.1:8000/static/data/icon/flag.svg";
        //     })
        //     .attr("x", function (d, i) {
        //         // return 5;
        //         return c_number * (pixel_w + 2) + 2 * cluster_padding - 2 + lsft_chushi +4;
        //     })
        //     .attr("y", function (d, i) {
        //         return 20;
        //     })
        //     .attr("width", "17")
        //     .attr("height", "17")
        //     .attr("index", index)
        //     .on("click", function () {
        //
        //     });
        d3.select("#cluster" + index.toString())
            .append("image")
            .attr("xlink:href", function (d, i) {
                return "http://127.0.0.1:8000/static/data/icon/more_.svg";
            })
            .attr("id", function () {
                return "cluster_rect" + index.toString();
            })
            .attr("hang", hang)
            .attr("x", function (d, i) {
                return c_number * (pixel_w + 2) + 2 * cluster_padding - 2 + lsft_chushi + 2;
            })
            .attr("y", function (d, i) {
                return 50;
            })
            .attr("width", "15")
            .attr("height", "15")
            .attr("index", index)
            .on("click", function () {
                click_index = d3.select(this).attr("id").substring(12,);
                hang_ = d3.select(this).attr("hang");
                console.log("history hang");
                console.log(hang_);
                click_index = parseInt(click_index);

                overview_click_draw_raw_image(click_index, data, result_list.length, hang_);

            });
        d3.select("#cluster" + index.toString())
            .append("image")
            .attr("xlink:href", function (d, i) {
                return "http://127.0.0.1:8000/static/data/icon/close.svg";
            })
            .attr("class", function () {
                return index.toString();
            })
            .attr("status", function () {
                return "color";
            })
            .attr("x", function (d, i) {
                return c_number * (pixel_w + 2) + 2 * cluster_padding - 2 + lsft_chushi + 2.5;
            })
            .attr("y", function (d, i) {
                return 6;
            })
            .attr("width", "12")
            .attr("height", "12")
            .attr("index", index)
            .on("click", function () {
                // console.log("变image:click cluster rect");
                click_index = d3.select(this).attr("class");
                click_index = parseInt(click_index);
                class_status = d3.select(this).attr("status")
                hang_ = d3.select(this).attr("hang")
                // console.log(class_status);
                if (class_status == "image") {
                    //    绘制image
                    overview_click_draw_image_hang_(click_index, data, result_list.length, hang_);
                } else if (class_status == "color") {
                    //    绘制hotrect
                    overview_click_draw_hotrect(cluster, click_index);
                }
                for (var key in feedback_list) {
                    item = feedback_list[key];
                    for (var i = 0; i < item.length; i++) {
                        d3.select("#image_" + item[i]).attr("fill", same);
                    }
                }
            });

        d3.select("#cluster" + index.toString())
            .append("rect")
            .attr("id", function () {
                return "cluster_rect" + index.toString();
            })
            .attr("transform", function (d, i) {
                return "translate(" + 0 + "," + 0 + ")";
            })
            .attr("class", "image")
            .attr("width", c_number * (pixel_w + 2) + 2 * cluster_padding - 2 + lsft_chushi + 2)
            .attr("height", pixel_h + 2 * cluster_padding + 7 + top_chushi)
            .attr("fill", "rgba(255,0,0,0)")
            .attr("stroke", "#bfbfbf")
            .attr("stroke-width", "2px")
            .attr("rx", 5)
            .on("click", function () {
                // console.log("变image:click cluster rect");
                click_index = d3.select(this).attr("id").substring(12,);
                click_index = parseInt(click_index);
                class_status = d3.select(this).attr("class")
                hang_ = d3.select(this).attr("hang")
                // console.log(class_status);
                if (class_status == "hotrect_da") {
                    //    绘制image
                    overview_click_draw_image_hang_(click_index, data, result_list.length, hang_);
                } else if (class_status == "image") {
                    //    绘制hotrect
                    overview_click_draw_hotrect(cluster, click_index);
                }
            });
        d3.select("#cluster" + index.toString())
            .append("circle")
            .attr("fill", "#828080")
            .attr("stroke", "#828080")
            .attr("stroke-width", "0px")
            .attr("cx", function () {
                return 0;
            })
            .attr("cy", function () {
                return 0;
            })
            .attr("r", 7);

        d3.select("#cluster" + index.toString())
            .append("text")
            .attr("font-family", "sans-serif")
            .attr("font-size", "11px")
            .attr("fill", "white")
            .text(hang)
            .attr("x", function () {
                return -3;
            })
            .attr("y", function () {
                return 4;
            });

        //填充image
        for (var k = 0; k < rank_list.length; k++) {
            d3.select("#cluster" + index.toString())
                .append("svg:image")
                .attr("xlink:href", function () {
                    return "http://127.0.0.1:8000/static/data/image/color_image_W_5/color_" + image_path_list[k].substring(58,);
                    // return image_path_list[k];
                })
                .attr("x", function () {
                    return (pixel_w + 2) * parseInt(k) + cluster_padding + lsft_chushi;
                })
                .attr("y", function () {
                    return pixel_h * parseInt(0 / bian_list) + cluster_padding + top_chushi;
                })
                .attr("width", pixel_w)
                .attr("height", pixel_h);
        }
        for (var k = 0; k < rank_list.length; k++) {
            d3.select("#cluster" + index.toString())
                .append("circle")
                .attr("fill", "#f8da73")
                .attr("stroke", "#828080")
                // .attr("stroke-width", "0px")
                .attr("cx", function () {
                    return (pixel_w + 2) * parseInt(k) + cluster_padding + pixel_w / 2 + lsft_chushi;
                })
                .attr("cy", function () {
                    return pixel_h * parseInt(0 / bian_list) + cluster_padding + pixel_h + 5 + top_chushi;
                })
                .attr("class", "click_circle")
                .attr("id", "image_" + image_path_list[k].substring(58, 77))
                .attr("r", 2.5);
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
                .attr("class", "hotrect_da")
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
                    // console.log("上");
                    // console.log("变hotrect:click cluster rect");
                    click_index = d3.select(this).attr("id").substring(12,);
                    click_index = parseInt(click_index);
                    class_status = d3.select(this).attr("class")
                    // console.log(class_status);
                    if (class_status == "hotrect_da") {
                        //    绘制image
                        overview_click_draw_image(click_index, data, result_list.length);
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
                    .attr("index_num", function () {
                        return index.toString();
                    })
                    .attr("rect_num", function () {
                        return rank_list[k];
                    })
                    .attr("id", function () {
                        return "overview" + image_path_list[k].substring(58, 77);
                    })
                    .attr("width", hot_rect_s)
                    .attr("height", hot_rect_s)
                    .attr("fill", function (d, i) {
                        return scaleColor(rank_list[k] / H);
                    })
                    .attr("stroke", function () {
                        return "black";
                    });
            }
        }
    }


    for (var key in feedback_list) {
        item = feedback_list[key];
        for (var i = 0; i < item.length; i++) {
            d3.select("#image_" + item[i]).attr("fill", same);
        }
    }
}