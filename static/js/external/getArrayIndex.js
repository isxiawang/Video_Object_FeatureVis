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
