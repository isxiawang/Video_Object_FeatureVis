
function probeDisplay(pid) {

    // 获取一些div的长宽用户定义下面的svg
    var w = document.getElementById('query').clientWidth;
    var h = document.getElementById('query').clientHeight;
    var h1 = document.getElementById('overview').clientHeight;
    //query_svg定义
    var query_svg = d3.select("body")
        .select("#query_parameter")
        .select("#query")
        .select("#probe")
        .select("#probe_image")
        .append("svg")
        .attr("width", w / 2)
        .attr("height", h);

    //开始画图

    // d3.json("static/data/ForQueryFilter/display.json", function (error, data) {
    pid = pid.substr(0, 19);
    d3.json("../static/data/Display/" + pid + "_display.json", function (error, data) {
        // console.log(data);
        //绘制query
        query_svg.append("image")
            .attr("xlink:href", function (d, i) {
                return data.query;
            })
            .attr("x", 19)
            .attr("y", 10)
            .attr("width", "120")
            .attr("height", "240");

        //时空辅助视图
        function draw_space_time_information() {
            var camera = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6'];
            var time = [
                // {'min': 1, 'max': 163691, 'key': 's1'},
                // {'min': 1, 'max': 164727, 'key': 's2'},
                {'min': 1, 'max': 103487, 'key': 's3'},
                {'min': 1, 'max': 74761, 'key': 's4'},
                {'min': 1, 'max': 74935, 'key': 's5'},
                {'min': 1, 'max': 54346, 'key': 's6'}];

            var time_space_svg = d3.select("body")
                .select("#query_parameter")
                .select("#overview")
                .append("svg")
                .attr("width", w)
                .attr("height", h1);

            var camera_rect_x0 = 45;//camera轴rect元素的x坐标的起始值
            var camera_space = 54;//camera轴元素的间隔
            var camera_line_x0 = 43;//camera轴中竖线的x坐标的起始值
            var guidao_height = 520

            // 添加camera轴
            for (var index = 0; index < camera.length; index++) {
                time_space_svg.append("rect")
                    .attr("x", function () {
                        return camera_rect_x0 + index * camera_space;
                    })
                    .attr("y", 10)
                    .attr("width", camera_space)
                    .attr("height", 22)
                    .attr("stroke", "white")
                    .attr("fill", d3.rgb(210, 233, 200));

                //c1,c2,c3,c4,c5,c6
                time_space_svg.append("text")
                    .attr("fill", d3.rgb(171, 103, 5))
                    .attr("font-size", "16px")
                    .style('font-weight', 500)
                    .attr("x", function () {
                        return camera_rect_x0 + 17 + index * camera_space;
                    })
                    .attr("y", 26)
                    .text(function () {
                        return camera[index];
                    });

                //竖线
                time_space_svg.append("line")
                    .attr("x1", function () {
                        return camera_line_x0 + index * camera_space + 2;
                    })
                    .attr("y1", 40)
                    .attr("x2", function () {
                        return camera_line_x0 + index * camera_space + 2;
                    })
                    .attr("y2", guidao_height)
                    .attr("stroke", "#9c9b9b")
                    .attr("stroke-width", "0.3px");
            }

            time_space_svg.append("line")
                .attr("x1", function () {
                    return camera_line_x0 + index * camera_space;
                })
                .attr("y1", 40)
                .attr("x2", function () {
                    return camera_line_x0 + index * camera_space;
                })
                .attr("y2", guidao_height)
                .attr("stroke", "#9c9b9b")
                .attr("stroke-width", "0.3px");

            time_space_svg.append("svg:image")
                .attr("xlink:href", function (d, i) {
                    return "http://127.0.0.1:8000/static/data/icon/time_space.svg";
                })
                .attr("x", function (d, i) {
                    return 15;
                })
                .attr("y", function (d, i) {
                    return 10;
                })
                .attr("width", "20")
                .attr("height", "20")

            // time_space_svg.append("text")
            //     .attr("fill", "black")
            //     .attr("font-size", "13px")
            //     .style("font-weight", 500)
            //     .style("font-family", "Times New Roman")
            //     .attr("x", "290px")
            //     .attr("y", "30px")
            //     .text("camera");

            // time_space_svg.append("line")
            //     .attr("x1", "45px")
            //     .attr("y1", "32px")
            //     .attr("x2", camera_space * index+camera_space-11)
            //     .attr("y2", "32px")
            //     .attr("stroke", "black")
            //     .attr("stroke-width", "0.7px");

            // 添加time轴
            //time轴的变量
            var time_len = 0; // time轴实际的总长度
            for (var i = 0; i < time.length; i++) {
                time_len += (time[i].max - time[i].min);
            }
            var sum_height = 0; //当前time轴的总长度
            var time_height; //每一个time的长度
            var time_rect_y0 = 40;//time轴的y坐标
            var time_rect_x0 = 15;//time轴的x坐标
            var time_y = guidao_height - time_rect_y0 ;//去除time坐标名称的长度和y0之后的长度
            var linear_time = d3.scaleLinear()
                .domain([0, time_len])
                .range([0, time_y]); //time轴的比例尺
            // console.log(time_len);
            // console.log(time_y);
            for (var index = 0; index < time.length; index++) {
                time_height = linear_time(time[index].max - time[index].min);
                time_space_svg.append("rect")
                    .attr("x", time_rect_x0)
                    .attr("y", function () {
                        return time_rect_y0 + sum_height;
                    })
                    .attr("width", "22px")
                    .attr("height", time_height)
                    .attr("stroke", "white")
                    .attr("stroke-width", "0.7px")
                    .attr("fill", d3.rgb(191, 213, 245));

                time_space_svg.append("text")
                    .attr("fill", "#666666")
                    .attr("font-size", "14px")
                    .style('font-weight', 500)
                    .attr("x", "20px")
                    .attr("y", function () {
                        return time_rect_y0 + 5 + sum_height + time_height / 2;
                    })
                    .text(function () {
                        return time[index].key;
                    });

                sum_height = sum_height + time_height;
            }

            // time_space_svg.append("text")
            //     .attr("fill", "black")
            //     .attr("font-size", "13px")
            //     .style("font-weight", 500)
            //     .style("font-family", "Times New Roman")
            //     .attr("x", "14px")
            //     .attr("y", h4)
            //     .text("time");

            // for (var index = 0; index < time.length; index++) {
            //     time_height = (time[index].max - time[index].min) / scale;
            //     time_space_svg.append("rect")
            //         .attr("x", "15px")
            //         .attr("y", function () {
            //             return time_rect_y0 + sum_height;
            //         })
            //         .attr("width", "22px")
            //         .attr("height", time_height - 2)
            //         // .attr("stroke", "black")
            //         // .attr("stroke-width", "0.7px")
            //         .attr("fill", d3.rgb(191, 213, 245));
            //
            //     time_space_svg.append("text")
            //         .attr("fill", "#666666")
            //         .attr("font-size", "14px")
            //         .style('font-weight', 500)
            //         .attr("x", "20px")
            //         .attr("y", function () {
            //             return time_rect_y0 + 5 + sum_height + time_height / 2;
            //         })
            //         .text(function () {
            //             return time[index].key;
            //         });
            //
            //     // 添加min
            //     // time_space_svg.append("text")
            //     //     .attr("fill", "black")
            //     //     .attr("font-size", "10px")
            //     //     .style('font-weight', 500)
            //     //     .attr("x", "5px")
            //     //     .attr("y", function (d, i){
            //     //         return 42 + sum_h;
            //     //     })
            //     //     .text(function (d, i) {
            //     //         return time[index].min;
            //     //     });
            //
            //     //添加max
            //     // time_space_svg.append("text")
            //     //     .attr("fill", "black")
            //     //     .attr("font-size", "10px")
            //     //     .style('font-weight', 500)
            //     //     .attr("x", "5px")
            //     //     .attr("y", function (d, i){
            //     //         return 42 + sum_h + time_h + index * 5;
            //     //     })
            //     //     .text(function (d, i) {
            //     //         return time[index].max;
            //     //     });
            //
            //     sum_height = sum_height + time_height;
            // }

            // time_space_svg.append("text")
            //     .attr("fill", "black")
            //     .attr("font-size", "13px")
            //     .style("font-weight", 500)
            //     .style("font-family", "Times New Roman")
            //     .attr("x", "14px")
            //     .attr("y", "590px")
            //     .text("time");
        }

        draw_space_time_information()
    });
}