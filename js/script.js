/*声明三个自定义js方法*/
/*不区分大小写的判断包含， 用于搜索文章标题过滤文章*/
jQuery.expr[':'].contains = function (a, i, m) {
    return jQuery(a).text().toUpperCase()
            .indexOf(m[3].toUpperCase()) >= 0;
};
var blog_path = $('.theme_blog_path').val();
blog_path= blog_path.lastIndexOf("/") === blog_path.length-1?blog_path.slice(0, blog_path.length-1):blog_path;

/*使用pjax加载页面，速度更快，交互更友好*/
var content = $(".pjax");
var container = $(".post");

// 正常进入页面
$(window).load(function(){
    fnInit();
    bind();
    fnInitScroll();
    fnInitToc();
	fnInitNavright();
});

$(document).pjax('.nav-right nav a,.nav-left .avatar_target,.site_url', '.pjax', {fragment: '.pjax', timeout: 8000});
$(document).on({
    /*点击链接后触发的事件*/
    'pjax:click': function () {
        /*原有内容淡出*/
        content.removeClass('fadeIns').addClass('fadeOuts');
        /*请求进度条*/
        NProgress.start();
    },

    /*pjax开始请求页面时触发的事件*/
    'pjax:start': function () {
        content.css({'opacity': 0});
    },

    /*pjax请求回来页面后触发的事件*/
    'pjax:end': function () {
        NProgress.done();
        container.scrollTop(0);
        afterPjax();

        var isPjax = true;
        // 图片渲染导致最后高度不正确
        if ($(".div_img img").last().length > 0) {
            $(".div_img img").last().load(function(){
                fnInitScroll(isPjax);
            });
        }else{
            fnInitScroll(isPjax);
        }
        fnInitToc();
        fnInitNavright();
        /*移动端打开文章后，自动隐藏文章列表*/
        // if ($(window).width() <= 1024) {
            // $(".full-toc .full").trigger("click");
        // }
    }
});
function afterPjax() {
    /*渲染MathJax数学公式*/
    if($("script[type='text/x-mathjax-config']").length>0){
        $.getScript($("#MathJax-js").val(),function () {
            // MathJax.Hub.Queue(
            //     ["resetEquationNumbers",MathJax.InputJax.TeX],
            //     ["Typeset",MathJax.Hub]
            // );
        });
    }
    
    /*新内容淡入*/
    content.css({'opacity': 1}).removeClass('fadeOuts').addClass('fadeIns');
    bind();
}

/*鼠标移出文章列表后，去掉文章标题hover样式*/
$(".nav-right nav a").mouseenter(function (e) {
    $(".nav-right nav a.hover").removeClass("hover");
    $(this).addClass("hover");
});
$(".nav-right nav a").mouseleave(function (e) {
    $(this).removeClass("hover");
});

$(".nav-right form .search").on("input", function (e) {
    inputChange(e);
});
$(".nav-right form .search").on("change", function (e) {
    inputChange(e);
});
var searchContent;
/*根据搜索条件，过滤文章列表*/
function inputChange(e) {
    var val = $(e.currentTarget).val().trim();
    if (val == searchContent) {
        return;
    }
    searchContent = val;
    $(".nav-right form .cross").css("display", val == "" ? "none" : "block");
    if ($('#local-search-input').length>0) {
		$('#title-list-nav').hide();
		$('#local-search-result').show();
        searchAll(val);
    }

    if (val == "") {
        $(".nav-right nav a").css("display", "block");
	    $('#title-list-nav').show();
        $('#local-search-result').hide();
    } else if (val.substr(0, 1) == "#") {
        $("div.ac > ul").attr("class", "tag");
        $("div.acParent").css("display", "block");
        if (val.substr(1).length != 0) {
            $(".nav-right nav a").css("display", "none");
            $(".nav-right nav").find("a:contains_tag('" + val.substr(1) + "')").css("display", "block");
        }
    } else if (val.substr(0, 1) == "@") {
        $("div.ac > ul").attr("class", "author");
        $("div.acParent").css("display", "block");
        if (val.substr(1).length != 0) {
            $(".nav-right nav a").css("display", "none");
            $(".nav-right nav").find("a:contains_author('" + val.substr(1) + "')").css("display", "block");
        }
    }
}

function fnInit() {
    $('.more-menus').on('click', function () {
        $('.mobile-menus-out').addClass('show');
        $('.mobile-menus').addClass('show');
    })
    $('.mobile-menus-out,.mobile-menus a').on('click', function () {
        $('.mobile-menus-out').removeClass('show');
        $('.mobile-menus').removeClass('show');
    })

    $('.nav-left>ul').css('height', 'calc(100vh - '+($('.avatar_target img').outerHeight(true) + $('.author').outerHeight(true)+$('.nav-left .icon').outerHeight(true)+$('.left-bottom').outerHeight(true))+'px)');
    if ($('#local-search-result').length>0) {
        // 全文搜索
        $.getScript(blog_path + '/js/search.js', function () {
            searchFunc(blog_path + "/search.xml", 'local-search-input', 'local-search-result');
        })
    }
    //文章toc的显示隐藏事件
    $(".full-toc .post-toc-menu").on('click', function () {
        $('.post-toc').toggleClass('open');
    });
    /*清除搜索框*/
    $(".nav-right form .cross").on("click", function (e) {
        $(".nav-right form .search").val("").change();
        $(".nav-right form .search").focus();
    });
    /*回到页首*/
    $("#rocket").on("click", function (e) {
        $(this).addClass("launch");
        container.animate({scrollTop: 0}, 500);
    });
    container.scroll(function (e) {
        if (container.scrollTop() >= 200 && $("#rocket").css("display") == "none") {
            $("#rocket").removeClass("launch").css("display", "block").css("opacity", "0.5");
        } else if (container.scrollTop() < 200 && $("#rocket").css("display") == "block") {
            $("#rocket").removeClass("launch").css("opacity", "1").css("display", "none");
        }
    });
    if ($("#comments").hasClass("disqus")) {
        setTimeout(function () {
            if ($(".count-comment").text().trim() == "") {
                $(".count-comment").text(0);
            }
        }, 1500);
    }
    if ($(window).width() > 414) {
        /*设置文章列表title宽度*/
        $('.nav-right>nav>a>.post-title').css('width',$('.nav-right>nav>a').width() - $('.nav-right>nav>a>.post-date:first').width() - 40)
    }
}

/*绑定新加载内容的点击事件*/
function bind() {
    $(".article_number").text($("#yelog_site_posts_number").val());
    $(".site_word_count").text($("#yelog_site_word_count").val());
    $(".site_uv").text($("#busuanzi_value_site_uv").text());
    $("#busuanzi_value_site_uv").bind("DOMNodeInserted", function (e) {
        $(".site_uv").text($(this).text())
    });
    $(".site_pv").text($("#busuanzi_value_site_pv").text())
    $("#busuanzi_value_site_pv").bind("DOMNodeInserted", function (e) {
        $(".site_pv").text($(this).text())
    });
    $(".post .pjax .index").find("br").remove();
    $(".post .pjax .index h1:eq(0)").addClass("article-title");
    //绑定文章内分类的点击事件
    $(".post .pjax article .article-meta .book a").on("click", function (e) {
        $(".nav-left ul li>div[data-rel='" + $(this).data("rel") + "']").parents('.hide').each(function () {
            var _this = this;
            $(_this).removeClass('hide').prev().children('.fold').addClass('unfold');
            $(_this).parents('ul.sub').each(function () {
                $(this).height(parseInt($(this).attr('style').match(/\d+/g)[0]) + parseInt($(_this).attr('style').match(/\d+/g)[0]) + 1)
            })
        })
        $(".nav-left ul li>div[data-rel='" + $(this).data("rel") + "']").trigger("click");
        if ($(window).width() <= 1024) {
            $(".full-toc .full").trigger("click");
        } else if ($(".full-toc .full span").hasClass("max")) {
            $(".full-toc .full").trigger("click");
        }
    });
    //初始化文章toc
    $(".post-toc-content").html($(".post .pjax article .toc-ref .toc").clone());
    $(".post .pjax article .toc-ref").empty();
    //绑定文章toc的滚动事件
    $("a[href^='#']").click(function () {
        container.animate({scrollTop: $($(this).attr("href")).offset().top + container.scrollTop()}, 500);
        if ($(this).attr("href") === "#comments") {
            load$hide();
        }
        return false;
    });
    if ($("#comments").hasClass("disqus")) {
        var $disqusCount = $(".disqus-comment-count");
        $disqusCount.bind("DOMNodeInserted", function (e) {
            $(".count-comment").text(
                $(this).text().replace(/[^0-9]/ig, "")
            )
        });
    }
    /*给文章中的站内跳转绑定pjax*/
    $(document).pjax('.post .pjax article a[target!=_blank]', '.pjax', {fragment: '.pjax', timeout: 8000});

    /*初始化 img*/
    if (!img_resize || img_resize != 'photoSwipe') {
        $(".pjax").find('img').each(function () {
            if (!$(this).parent().hasClass('div_img')) {
                $(this).wrap("<div class='div_img'></div>");
                var alt = this.alt;
                if (alt) {
                    $(this).after('<div class="img_alt"><span>' + alt + '</span></div>');
                }
            }
            if ($(window).width() > 426) {
                $(this).on("click", function (e) {
                    var _that = $(this);
                    $("body").append('<img class="img_hidden" style="display:none" src="' + this.src + '" />');
                    var img_width = "";
                    var img_height = "";
                    var img_top = "";
                    var img_left = "";
                    if ((this.width / this.height) > (document.body.clientWidth / document.body.clientHeight) && $(".img_hidden").width() > document.body.clientWidth) {
                        img_width = document.body.clientWidth + "px";
                        img_height = this.height * document.body.clientWidth / this.width + "px";
                        img_top = (document.body.clientHeight - this.height * document.body.clientWidth / this.width) / 2 + "px";
                        img_left = "0px";
                    } else if (((this.width / this.height) < (document.body.clientWidth / document.body.clientHeight) && $(".img_hidden").height() > document.body.clientHeight)) {
                        img_width = this.width * document.body.clientHeight / this.height + "px";
                        img_height = document.body.clientHeight + "px";
                        img_top = "0px";
                        img_left = (document.body.clientWidth - this.width * document.body.clientHeight / this.height) / 2 + "px";
                    } else {
                        img_height = $(".img_hidden").height() + "px";
                        img_width = $(".img_hidden").width() + "px";
                        img_top = (document.body.clientHeight - $(".img_hidden").height()) / 2 + "px";
                        img_left = (document.body.clientWidth - $(".img_hidden").width()) / 2 + "px";
                    }
                    $("body").append('<div class="img_max" style="opacity: 0"></div>');
                    $("body").append('<img class="img_max" src="' + this.src + '" style="top:' + $(this).offset().top + 'px;left:' + $(this).offset().left + 'px; width:' + $(this).width() + 'px;height: ' + this.height + 'px;">');
                    $(this).css("visibility", "hidden");
                    setTimeout(function () {
                        $("img.img_max").attr("style", "").css({
                            "top": img_top,
                            "left": img_left,
                            "width": img_width,
                            "height": img_height
                        });
                        $("div.img_max").css("opacity", "1");
                    }, 10);
                    $(".img_max").on("click", function (e) {
                        $("img.img_max").css({
                            "width": _that.width() + "px",
                            "height": _that.height() + "px",
                            "top": _that.offset().top + "px",
                            "left": _that.offset().left + "px"
                        })
                        $("div.img_max").css("opacity", "0");
                        setTimeout(function () {
                            _that.css("visibility", "visible");
                            $(".img_max").remove();
                            $(".img_hidden").remove();
                        }, 500);
                    })
                })
            }
        });
    }

}

$('.category-change').click(function(){
	var data = $(this);
	var aimClass = data.children().attr('class');
	if (aimClass == 'iconfont icon-arrow-right') {
		data.children().attr('class','iconfont icon-arrow-down');
        data.next().css('display','block');
	}else if (aimClass == 'iconfont icon-arrow-down') {
		data.children().attr('class','iconfont icon-arrow-right');
		data.next().css('display','none');
	}
});

// 左侧菜单栏跳转
function fnToPost(data){
	$(".a-active").removeAttr("class","a-active");
	$(data).addClass("a-active");
}

// 初始化导航栏
function fnInitToc(){
	$(".toc").children().find("a").each(function(){
        // 添加title属性
        $(this).attr("title", $(this).text());
        //修复链接乱码问题,以及可能的空格问题
        $(this).attr('href', '#' + this.title.replaceAll(' ','-').replaceAll('.','-'));
    }); 
	// 如果超高了，则设置bottom值
	$(".post-toc").css('bottom','auto');
	if ($(".post").outerHeight() - 120 < $(".post-toc").outerHeight()) {
		$(".post-toc").css('bottom','40px');
	}
}

// 初始化菜单栏选中情况
function fnInitNavright(){
	$(".a-active").removeAttr("class","a-active");
	var postTitle = $("span.post-title[title='"+ document.title.split(" ")[0] +"']").parent();
	if (!postTitle.hasClass("a-active")) postTitle.addClass("a-active");
	$(".system-active").removeAttr("class","system-active");
    var urlPath = $(".icon-cc-book span:first-child").html();
    if (urlPath) {
        $("#" + urlPath).addClass("system-active");
    } else {
        $("#without-category-a").addClass("system-active");
    }
}

// TODO 处理当系统过多时，显示更多条目
function fnInitSystemShow(){
	var ratio = 0.4;
	if ($("#site-header").width()*ratio < $(".header-list").width()){
		var systemArr = [];
	}
}

// TODO 初始化导航栏选中状况
function fnInitScroll(isPjax){
	if (!$('.article-entry a[class="headerlink"]').length > 0) return;
	isPjax = isPjax === undefined ? false : isPjax;
	var baseHeight = isPjax ? 30 : 0;
	// var cssError = isPjax ? 68 - ($('.article-entry a[class="headerlink"]').first().offset().top - 20 - baseHeight) : 0;
	var maxScroll = $(".pjax").outerHeight() - $(".post").outerHeight() - 20;
	var targets = [];
	var offsets = [];
	$(".toc .active a").parent().removeClass('active');
	// $($(".toc a")[0]).parent().addClass("active");
	$('.article-entry').find('a[class="headerlink"]').map(function () {
		return ([[$(this).offset().top - 20 - baseHeight,$(this).attr('href')]])
	}).sort(function (a, b) { return a[0] - b[0] }).each(function () {
		offsets.push(this[0]);
		targets.push(this[1]);
	})
	// $(".post").bind("scroll",function(){
	// 	//滚动条的高度
	// 	var scrollTop = $(".post").scrollTop();
	// 	if (scrollTop > maxScroll) {
	// 		fnActivate(targets[targets.length - 1]);
	// 		return;
	// 	}
	// 	var activeTarget = $(".toc .active a").attr('href');
	// 	for (i = offsets.length; i--;) {
	// 		activeTarget != targets[i]
	// 		&& scrollTop >= offsets[i]
	// 		&& (!offsets[i + 1] || scrollTop <= offsets[i + 1])
	// 		&& fnActivate(targets[i])
	// 	}     
	// });
}

// 激活选中状态
function fnActivate(target){
	$(".toc .active a").parent().removeClass('active');
	$(".toc a[href='"+ target +"']").parent().addClass('active');
}