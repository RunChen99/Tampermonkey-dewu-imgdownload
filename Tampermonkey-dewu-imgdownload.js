// ==UserScript==
// @name         得物图片下载工具
// @namespace    http://tampermonkey.net/
// @icon         https://www.dewu.com/static/favicon.ico
// @version      1.0.0
// @description  得物图片下载工具
// @author       RunChen
// @match        https://www.dewu.com/*
// @match        https://*.dewu.com/*
// @grant        none
// @grant        GM_download
// ==/UserScript==

(function() {
    'use strict';
    let spuImages = [];
    let colorImages = [];
    let detailImages = [];
    let url_title = "";

    // 重写 fetch 方法
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        const url = args[0];

        // 判断是否是我们关注的 API 请求
        if (url.includes("https://app.dewu.com/api/v1/h5/pc/index/fire/flow/product/detailV3")) {
            console.log('捕获到 fetch 请求:', url);

            // 调用原始 fetch 方法
            return originalFetch(...args)
                .then(response => {
                    // 捕获请求的返回数据
                    const clone = response.clone();
                    clone.json().then(data => {
                        console.log('捕获到的请求数据：', data);

                        //spuImages.length = 0;
                        //colorImages.length = 0;
                        //detailImages.length = 0;


                        // 假设返回的数据结构中包含一个图片 URL 数组（您可能需要根据实际的 API 返回结构修改）
                        extractImageUrls(data);  // 提取图片 URL

                        // 显示数据
                        displayDataAsText(data);  // 显示捕获到的数据

                        // 在这里可以对返回的数据进行进一步处理
                        //alert('捕获到指定请求的数据，已解析图片链接，请查看控制台！');
                    });

                    // 返回原始的 response
                    return response;
                })
                .catch(error => {
                    console.error('请求错误:', error);
                    throw error;
                });
        }

        // 如果不是目标请求，调用原始 fetch 方法
        return originalFetch(...args);
    };

    // 提取图片 URL（您可能需要根据返回的数据结构调整解析逻辑）
    function extractImageUrls(data) {
        // 假设 `data` 是从API返回的JSON数据
        url_title = data.data.detail.title; // 商品标题
        //alert(title);

        spuImages = data.data.image.spuImage.images.map(image => image.url);  //商品主图
        //alert(spuImages);


        colorImages = data.data.saleProperties.list  //商品颜色图
          .filter(property => property.name === "颜色")
          .map(property => ({
            levelImageUrl: property.levelImageUrl,
            value: property.value
          }));
        //alert(colorImages);

        detailImages = data.data.imageAndText      // 商品详情页
          .filter(item => item.type === "image")
          .flatMap(item => item.images.map(image => image.url));
        //alert(detailImages);

    }

    // 显示捕获到的数据
    function displayDataAsText(data) {
        const dataContainer = document.getElementById('apiResponseText');
        if (!dataContainer) {
            // 如果没有该容器，创建一个新的容器
            const newContainer = document.createElement('div');
            newContainer.id = 'apiResponseText';
            newContainer.style.position = 'fixed';
            newContainer.style.top = '100px';
            newContainer.style.right = '20px';
            newContainer.style.maxWidth = '300px';
            newContainer.style.maxHeight = '400px';
            newContainer.style.overflow = 'auto';
            newContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            newContainer.style.color = 'white';
            newContainer.style.padding = '10px';
            newContainer.style.fontSize = '12px';
            newContainer.style.zIndex = '1000';
            document.body.appendChild(newContainer);
        }

        // 将数据转化为文本格式并显示
        const formattedText = JSON.stringify(data, null, 2);  // 格式化 JSON 数据
        document.getElementById('apiResponseText').innerText = formattedText;
    }

    // 在页面上动态创建“下载图片”按钮
    function createDownloadButton() {
        const button = document.createElement('button');
        button.innerText = '下载图片';
        button.style.position = 'fixed';
        button.style.top = '20px';
        button.style.right = '20px';
        button.style.zIndex = '1000';
        button.style.padding = '10px';
        button.style.fontSize = '16px';
        button.style.backgroundColor = '#4CAF50';
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.cursor = 'pointer';
        button.addEventListener('click', downloadImages);  // 点击按钮时下载图片
        document.body.appendChild(button);
    }

    // 下载所有图片
    function downloadImages() {
        if (spuImages.length === 0) {
            alert('没有图片可供下载！');
            return;
        }
        alert(`开始下载图片主图${spuImages.length}张；颜色图：${colorImages.length}张；详情页${detailImages.length}张；`)
        //spuImages   colorImages   detailImages
        const delayTime = 1000; // 每次下载间隔 2 秒

        // 遍历所有图片 URL，使用 GM_download 进行下载
        spuImages.forEach((url, index) => {   //下载商品主图
            const fileName = `${url_title}_商品主图_image_${index + 1}.jpg`;  // 为每张图片生成文件名
            setTimeout(() => {
                downloadImage(url,fileName);
            }, index * delayTime); // 按顺序延迟执行
        });

        // 遍历所有图片 URL，使用 GM_download 进行下载
        colorImages.forEach((url, index) => {   //下载商品颜色图
            const fileName = `${url_title}_商品颜色_image_${url.value}.jpg`;  // 为每张图片生成文件名
            setTimeout(() => {
                downloadImage(url.levelImageUrl,fileName);
            }, index * delayTime); // 按顺序延迟执行
        });

        // 遍历所有图片 URL，使用 GM_download 进行下载
        detailImages.forEach((url, index) => {   //下载商品详情页图片
            const fileName = `${url_title}_商品详情页_image_${index + 1}.jpg`;  // 为每张图片生成文件名
            setTimeout(() => {
                downloadImage(url,fileName);
            }, index * delayTime); // 按顺序延迟执行
        });



        alert('图片下载开始！等待下载完毕后请注意移入文件夹');
    }


    // 下载图片函数
    function downloadImage(url, fileName) {
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error('图片下载失败，状态码: ' + response.status);
                }
                return response.blob();
            })
            .then(blob => {
                const blobUrl = URL.createObjectURL(blob); // 创建 Blob URL
                const a = document.createElement('a');
                a.href = blobUrl;
                a.download = fileName; // 设置下载文件名
                document.body.appendChild(a);
                a.click(); // 模拟点击下载
                document.body.removeChild(a); // 移除临时元素
                URL.revokeObjectURL(blobUrl); // 释放 Blob URL
                console.log('图片下载成功:', fileName);
            })
            .catch(error => {
                console.error('下载图片时出错:', error);
            });
    }


    // 等待页面加载完成后创建按钮
    window.addEventListener('load', () => {
        createDownloadButton();
    });

})();



