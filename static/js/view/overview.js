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
        .domain([0, H])
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
                    return scaleColor(rank_list[k] / H);
                })
                .attr("stroke", "black");
        }
    }
}

//tsne投影 + dbcsan聚类 + gridlayout + [rank_hot_rect] + [drag]
function show5(data, N) {
    // console.log("show5")
    // console.log(data)

    //overview的参数
    var padding = {top: 10, right: 50, bottom: 80, left: 50}
    //热力图颜色比例尺
    var scaleColor = d3.scaleLinear()
        .domain([1, 0])
        .range(["#e3c494", "green"]);
    //hotrect边长等
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
        overview_click_draw_hotrect(cluster, index, N)
    }
    //绘制整个image
    // function overview_click_draw_image(cluster, index) {
    //     var image_w = 30
    //     var image_h = 60
    //     var cluster_padding = 3
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
    //         .attr("fill", "rgb(255,0,0,0)")
    //         .attr("stroke", "black")
    //         .on("click", function () {
    //             console.log("变image:click cluster rect");
    //             click_index = d3.select(this).attr("id").substring(12,);
    //             click_index = parseInt(click_index);
    //             class_status = d3.select(this).attr("class")
    //             console.log(class_status);
    //             if (class_status == "hotrect") {
    //                 //    绘制image
    //                 overview_click_draw_image(cluster, click_index);
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
    // }

    //绘制image的像素表示
    function overview_click_draw_image(cluster, index, N) {
        var image_w = 30
        var image_h = 60
        var cluster_padding = 3
        var pixel_w = 5
        var pixel_h = pixel_w * 10
        var lsft_chushi = 2
        var top_chushi = 3


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
            .attr("width", c_number * (pixel_w + 2) + 2 * cluster_padding - 2 + lsft_chushi + 2)
            .attr("height", pixel_h + 2 * cluster_padding + 7 + top_chushi)
            .attr("fill", "rgb(255,255,255)")
            .attr("stroke", "#bfbfbf")
            .attr("stroke-width", "2px")
            .attr("rx", 5)
            .on("click", function () {
                console.log("变image:click cluster rect");
                click_index = d3.select(this).attr("id").substring(12,);
                click_index = parseInt(click_index);
                class_status = d3.select(this).attr("class")
                console.log(class_status);
                if (class_status == "hotrect_da") {
                    //    绘制image
                    overview_click_draw_image(cluster, click_index, N);
                } else if (class_status == "image") {
                    //    绘制hotrect
                    overview_click_draw_hotrect(cluster, click_index, N);
                }
            });
        d3.select("#cluster" + index.toString())
            .append("image")
            .attr("xlink:href", function (d, i) {
                return "http://127.0.0.1:8000/static/data/icon/more_.svg";
            })
            .attr("id", function () {
                return "cluster_rect" + index.toString();
            })
            // .attr("hang", hang)
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
                // hang_ = d3.select(this).attr("hang");
                // console.log("initial hang");
                // console.log(hang_);
                click_index = parseInt(click_index);

                overview_click_draw_raw_image(click_index, data, N);
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
                    overview_click_draw_image(click_index, data, result_list.length, N);
                } else if (class_status == "color") {
                    //    绘制hotrect
                    overview_click_draw_hotrect(cluster, click_index, N);
                }
                for (var key in feedback_list) {
                    item = feedback_list[key];
                    for (var i = 0; i < item.length; i++) {
                        d3.select("#image_" + item[i]).attr("fill", same);
                    }
                }
            });
        //填充image
        for (var k = 0; k < rank_list.length; k++) {
            d3.select("#cluster" + index.toString())
                .append("svg:image")
                .attr("xlink:href", function () {
                    // return "http://127.0.0.1:8000/static/data/image/color_block_image_5/color_" + image_path_list[k].substring(58,);
                    return "http://127.0.0.1:8000/static/data/image/color_image_W_5/color_" + picture_path_list[k].substring(58,);
                    // return "http://127.0.0.1:8000/static/data/image/color_block_image_5/c_" + image_path_list[k].substring(58,);
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
            d3.select("#cluster" + index.toString())
                .append("circle")
                .attr("fill", "#9dd7de")
                .attr("stroke", "#828080")
                // .attr("stroke-width", "0px")
                .attr("cx", function () {
                    return (pixel_w + 2) * parseInt(k) + cluster_padding + pixel_w / 2 + lsft_chushi;
                })
                .attr("cy", function () {
                    return pixel_h * parseInt(0 / bian_list) + cluster_padding + pixel_h + 5 + top_chushi;
                })
                .attr("id", "image_" + image_path_list[k].substring(58, 77))
                .attr("r", 2.5);
        }
    }

    function overview_click_draw_raw_image(index, data, N) {
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
                if (class_status == "color") {
                    //    绘制image
                    overview_click_draw_hotrect(cluster, click_index, N);
                } else if (class_status == "image") {
                    //    绘制hotrect
                    overview_click_draw_image(cluster, click_index, N);
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
                if (class_status == "hotrect") {
                    //    绘制image
                    overview_click_draw_image(click_index, data, result_list.length, N);
                } else if (class_status == "image") {
                    //    绘制hotrect
                    overview_click_draw_image_hang_(click_index, data, result_list.length, hang_, N);
                }
            });
        // d3.select("#cluster" + index.toString())
        //     .append("circle")
        //     .attr("fill", function () {
        //         console.log(hang_);
        //         console.log("hang_");
        //         if (hang == hang_) {
        //             return "#f8c309";
        //         } else {
        //             return "#828080";
        //         }
        //
        //     })
        //     .attr("stroke", "#828080")
        //     .attr("stroke-width", "0px")
        //     .attr("cx", function () {
        //         return 0;
        //     })
        //     .attr("cy", function () {
        //         return 0;
        //     })
        //     .attr("r", 7);

        // d3.select("#cluster" + index.toString())
        //     .append("text")
        //     .attr("font-family", "sans-serif")
        //     .attr("font-size", "11px")
        //     .attr("fill", "white")
        //     .text(hang_)
        //     .attr("x", function () {
        //         return -3;
        //     })
        //     .attr("y", function () {
        //         return 4;
        //     });

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


        function overview_click_draw_hotrect(cluster, index, N) {
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
                        overview_click_draw_image_hang_(click_index, data, result_list.length, hang_, N);
                    } else if (class_status == "image") {
                        //    绘制hotrect
                        overview_click_draw_hotrect(cluster, click_index, N);
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

    function overview_click_draw_hotrect(cluster, index, N) {
        // console.log("N");
        // console.log(N);
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
            .attr("class", function () {
                return "cluster_index";
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
                console.log("变hotrect:click cluster rect");
                click_index = d3.select(this).attr("id").substring(12,);
                click_index = parseInt(click_index);
                class_status = d3.select(this).attr("class")
                console.log(class_status);
                if (class_status == "hotrect_da") {
                    //    绘制image
                    overview_click_draw_image(cluster, click_index, N);
                } else if (class_status == "image") {
                    //    绘制hotrect
                    overview_click_draw_hotrect(cluster, click_index, N);
                }
            });
        //填充hotrect


        // console.log("NN");
        // console.log(N);
        var scaleColor = d3.scaleLinear()
            .domain([N, N * (6 / 7), N * (5 / 7), N * (4 / 7), N * (3 / 7), N * (2 / 7), N * (1 / 7), 0])
            .range(["#e3c494", "#f7fcb9",
                "#addd8e", "#41ab5d", '#41ab5d',
                "#238443", "#025f3a"]);
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
                .attr("image", image_path_list[k])
                .attr("class", "hotrect")
                .attr("width", hot_rect_s)
                .attr("height", hot_rect_s)
                .attr("fill", function (d, i) {
                    // console.log(scaleColor(rank_list[k] / 883));
                    return scaleColor(rank_list[k]);
                })
                .attr("stroke", function () {
                    return "black";
                })
                .on("click", function () {
                    console.log("test");
                    image_link = d3.select(this).attr("image");
                    cluster_id = "cluster" + d3.select(this).attr("index_num");
                    trans = d3.select("#" + cluster_id).attr("transform");
                    c = trans.substring(10).split(',');
                    x = c[0];
                    y = c[1];
                    yl = y.length;
                    y = c[1].substring(0, yl - 1);
                    console.log(x);
                    console.log(y);


                    cc_x = d3.select(this).attr("x");
                    cc_y = d3.select(this).attr("y");
                    console.log(cc_x);
                    console.log(cc_y);
                    x = parseInt(x) + parseInt(cc_x);
                    y = parseInt(y) + parseInt(cc_y);
                    console.log(x);
                    console.log(y);

                    svg_new = d3.select("#svg1")

                    tanchu = d3.select(".tanchu");
                    console.log(tanchu);
                    if (tanchu["_groups"][0][0] === null) {
                        image = d3.select(this).attr("image")

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
                            .attr("image", image.substring(58, 77))
                            .on("click", function () {
                                //
                                iplk = d3.select(this).attr("image");
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

                            })

                    } else {
                        d3.selectAll(".tanchu").remove();
                    }


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


function jianbian() {
    //渐变条带
    linear = d3.scaleLinear().domain([0, 100]).range([0, 1])
    compute = d3.interpolate('#dec3c3', 'green')
    jianbiandai_svg.selectAll('rect').data(d3.range(100)).enter()
        .append('rect')
        .attr('x', (d, i) => (i * 1.7 + 20))
        .attr('y', 0)
        .attr('width', 10)
        .attr('height', 13)
        .style('fill', (d, i) => compute(linear(d)))
    jianbiandai_svg.selectAll('line').data(d3.range(11)).enter()
        .append('line')
        .attr('x1', (d, i) => i * 17.7 + 21)
        .attr('y1', 0)
        .attr('x2', (d, i) => i * 17.7 + 21)
        .attr('y2', 17)
        .style('stroke', "#171616")
        .style('stroke-width', "1px")
    jianbiandai_svg.selectAll('text').data(d3.range(11)).enter()
        .append('text')
        .attr("fill", "black")
        .attr("font-size", "10px")
        .attr('x', (d, i) => i * 17 + 27)
        .attr('y', 26)
        .text(function (d, i) {
            return d;
        })
}

//交互式的界面
function show7(data) {
    //overview : [rank_hot_rect]

    show5(data, 850)
    jianbian()
}