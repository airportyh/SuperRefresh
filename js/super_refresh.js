var mainURL, 
    urlBar, 
    frame, 
    scriptTags, 
    cssLinkTags,
    frameLoadTime, 
    intervalID,
    lastFetchedTimes = {},
    contentHashes = {},
    isLocal = window.location.protocol === 'file:',
    compareMode = isLocal ? 'Content' : 'LastModified',
    scrollOffsets = {},
    cantAccessIframe = false,
    refreshing = [],
    myHistory = [],
    usePushState = false

function addTS(url, date){
    return url + '?' + (date.getTime())
}

function addRandom(url){
    var seed = Math.random()
    seed = Math.round(seed * 10000000)
    return url + '?' + seed
}

function ajax(url, method, callback){
    var xhr = new XMLHttpRequest()
    xhr.onreadystatechange = callback
    xhr.open(method, url, true)
    xhr.send()
}

function filter(array, func){
    var ret = []
    for (var i = 0, len = array.length; i < len; i++){
        var item = array[i]
        if (func(item))
            ret.push(item)
    }
    return ret
}

function stripQS(url){
    var i = url.indexOf('?')
    if (i < 0) return url
    return url.substring(0, i)
}
function ifModified(url, onModified){
    url = stripQS(url)
    var randUrl = addRandom(url)
    try{
        ajax(randUrl, 'GET', function(){
            if (this.readyState == 4){
                if (compareMode == 'LastModified'){
                    var lastModified = new Date(this.getResponseHeader('Last-Modified'))
                    var lastFetched = lastFetchedTimes[url] || frameLoadTime
                    if (lastModified.getTime() > lastFetched.getTime()){
                        onModified(addTS(url, lastModified))
                        lastFetchedTimes[url] = lastModified
                    }
                }else{
                    var content = this.responseText
                    if (contentHashes[url] != content){
                        if (url in contentHashes)
                            onModified(randUrl)
                        contentHashes[url] = content
                    }
                }
            }
        })
    }catch(e){}
}

function refresh(){
    if (cantAccessIframe){
        refreshing.push(stripQS(mainURL))
        setURL(mainURL)
        return
    }
    ifModified(mainURL, function(url){
        setURL(mainURL)
    })
    for (var i = 0, len = cssLinkTags.length; i < len; i++){
        var link = cssLinkTags[i]
        var url = link.href
        ifModified(url, function(url){
            link.href = url
        })
    }

    for (var i = 0, len = scriptTags.length; i < len; i++){
        var script = scriptTags[i]
        var url = script.src
        ifModified(url, function(url){
            setURL(mainURL)
        })
    }
}

function setFrameHeight(){
    var height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight
    frame.style.height = (height - frame.offsetTop) + 'px'
}
function onWindowResize(){
    setFrameHeight()
}
function setTitle(){
    try{
        document.title = 'SuperRefresh - ' + frame.contentDocument.title
    }catch(e){
        document.title = 'SuperRefresh - ' + document.title
    }
    
}

function setURL(url){
    console.log('url: ' + url)
    myHistory.push(url)
    refreshing.push(stripQS(url))
    frame.src = url
}

function setTopURL(url){
    console.log('setTopURL: ' + url)
    if (usePushState){
        history.pushState({url: url}, null, url)
    }else{
        urlBar.innerHTML = url
    }
}

function onFrameLoaded(e){
    var url
    console.log(JSON.stringify(refreshing))
    try{
        mainURL = frame.contentWindow.location.toString()
    }catch(e){
        cantAccessIframe = true
        mainURL = window.location.toString()
        setTopURL(stripQS(mainURL))
        return
    }
    var push = refreshing.indexOf(mainURL) === -1
    if (push){
        console.log('User clicked URL ' + mainURL)
    }else{
        refreshing.splice(refreshing.indexOf(mainURL), 1)
    }
    url = stripQS(mainURL)
    if (push) setTopURL(url)

    frameLoadTime = new Date()
    setTitle()
    var doc = frame.contentDocument
    var frameWindow = frame.contentWindow
    var frameDocument = frameWindow.document

    scriptTags = filter(frameDocument.getElementsByTagName('script'),
        function(tag){
            return Boolean(tag.src)
        })

    cssLinkTags = filter(frameDocument.getElementsByTagName('link'),
        function(tag){
            return tag.rel == 'stylesheet'
        })

    if (scrollOffsets[url]){
        var scrollOffset = scrollOffsets[url]
        frameWindow.scrollTo(scrollOffset.x, scrollOffset.y)
    }

    onEvent(frameWindow, 'scroll', function(){
        scrollOffsets[url] = {x: frameWindow.pageXOffset, y: frameWindow.pageYOffset}
    })


    if (!intervalID)
        intervalID = setInterval(refresh, cantAccessIframe ? 3000 : 1000)
}

function removeChildren(elm){
    for (var i = 0, len = elm.childNodes.length; i < len; i++){
        var child = elm.childNodes[i]
        if (child) elm.removeChild(child)
    }
}

function blankOutPage(){
    var head = document.getElementsByTagName('head')[0]
    removeChildren(head)
    document.body.innerHTML = ''
}

var onEvent = (function () {
  if (document.addEventListener) {
    return function (el, type, fn) {
      if (el && el.nodeName || el === window) {
        el.addEventListener(type, fn, false);
      } else if (el && el.length) {
        for (var i = 0; i < el.length; i++) {
          onEvent(el[i], type, fn);
        }
      }
    };
  } else {
    return function (el, type, fn) {
      if (el && el.nodeName || el === window) {
        el.attachEvent('on' + type, function () { return fn.call(el, window.event); });
      } else if (el && el.length) {
        for (var i = 0; i < el.length; i++) {
          onEvent(el[i], type, fn);
        }
      }
    };
  }
})();

function onPopState(e){
    var state = e.state
        url = state && state.url
    window.evt = e
    console.log('pop state with url: ' + JSON.stringify(e.state))
    if (url)
        frame.src = addRandom(url)
}

function buildPage(){
    var css = '\
#frame{\
	position: fixed;\
	top: 24px;\
	width: 100%;\
	border: none 0px;\
	border-top: 1px solid #aaa;\
}\
body{\
	font-family: "Helvetica", "Arial";\
	margin: 0;\
	padding: 0;\
	overflow: hidden;\
}\
h1{\
    font-size: 20px;\
	color: #8cc21f;\
	margin: 2px 4px;\
}\
h1 span{\
	color: #4ca1cc;\
}\
#urlBar{\
    position: absolute;\
    right: 0px;\
    top: 0px;\
    font-size: 15px;\
    height: 18px;\
    padding: 3px;\
    border: 1px solid #aaa;\
    background: #ddd;\
}'
	var style = document.createElement('style')
	style.type = 'text/css'
	if (style.styleSheet)
	    style.styleSheet.cssText = css
	else
	    style.appendChild(document.createTextNode(css))
	var head = document.getElementsByTagName('head')[0]
	var title = document.createElement('title')
	title.appendChild(document.createTextNode('SuperRefresh'))
	head.appendChild(title)
	head.appendChild(style)
	var markup = '<h1><span>super</span>refresh</h1>'
	if (!usePushState)
	    markup += '<div id="urlBar"></div>'
	markup += '<iframe id="frame"></iframe>'
    document.body.innerHTML = markup
    frame = document.getElementById('frame')
    urlBar = document.getElementById('urlBar')
    setFrameHeight()
    onEvent(window, 'resize', onWindowResize)
}

if (usePushState)
    onEvent(window, 'popstate', onPopState)
function init(url){
    mainURL = url
    blankOutPage()
    buildPage()
    frame = document.getElementById('frame')
    onEvent(frame, 'load', onFrameLoaded)
    setURL(addRandom(url))
}

