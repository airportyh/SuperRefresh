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
    scrollOffset,
    cantAccessIframe = false

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
        frame.src = mainURL
        return
    }
    ifModified(mainURL, function(url){
        frame.src = url
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
            if (cantAccessIframe)
                frame.src = mainURL
            else
                frame.contentWindow.document.location.reload()
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

function onFrameLoaded(e){
    try{
        mainURL = frame.contentWindow.location.toString()

        urlBar.innerHTML = stripQS(mainURL)
    
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


        if (scrollOffset)
            frameWindow.scrollTo(scrollOffset.x, scrollOffset.y)

        onEvent(frameWindow, 'scroll', function(){
            scrollOffset = {x: frameWindow.pageXOffset, y: frameWindow.pageYOffset}
        })
    }catch(e){
        cantAccessIframe = true
        mainURL = window.location.toString()
        urlBar.innerHTML = stripQS(mainURL)
    }

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

function onEvent(elm, event, callback){
    if (elm.addEventListener)
        elm.addEventListener(event, callback, false)
    else if (elm.attachEvent)
        elm.attachEvent('on' + event, callback)
}

function buildPage(){
    var css = '\
#frame{\
	position: fixed;\
	top: 24px;\
	width: 100%;\
	border: none 0px;\
	border-top: 1px solid #888;\
}\
body{\
	font-family: "Helvetica", "Arial";\
	margin: 0;\
	padding: 0;\
	overflow: hidden;\
}\
h1{\
    font-size: 20px;\
    margin: 0; padding: 0;\
	color: #8cc21f;\
	margin-left: 0.2em;\
}\
h1 span{\
	color: #4ca1cc;\
}\
#urlBar{\
    position: absolute;\
    right: 5px;\
    top: 0px;\
    color: #888;\
    padding-top: 8px;\
    font-size: 12px\
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
    document.body.innerHTML = '<h1><span>super</span>refresh</h1>\
<div id="urlBar"></div>\
<iframe id="frame"></iframe>'
    frame = document.getElementById('frame')
    urlBar = document.getElementById('urlBar')
    setFrameHeight()
    onEvent(window, 'resize', onWindowResize)
}

function init(url){
    mainURL = url
    blankOutPage()
    buildPage()
    frame = document.getElementById('frame')
    onEvent(frame, 'load', onFrameLoaded)
    frame.src = addRandom(mainURL)
}

