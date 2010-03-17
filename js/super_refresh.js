var mainURL, urlBar, frame, scriptTags, cssLinkTags
var frameLoadTime, intervalID
var lastFetchedTimes = {}
var contentHashes = {}
var compareMode = 'Content'
var scrollOffset

if (!window.console)
    window.console = {log: function(){}}

function toArray(thing){
    var ret = []
    for (var i = 0; i < thing.length; i++)
        ret.push(thing[i])
    return ret
}

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

function stripQS(url){
    var i = url.indexOf('?')
    if (i < 0) return url
    return url.substring(0, i)
}

function ifModified(url, onModified){
    //console.log('isModified')
    url = stripQS(url)
    var randUrl = addRandom(url)
    ajax(randUrl, 'GET', function(){
        if (this.readyState == 4){
            //console.log('xhr finished.')
            if (compareMode == 'LastModified'){
                var lastModified = new Date(this.getResponseHeader('Last-Modified'))
                var lastFetched = lastFetchedTimes[url] || frameLoadTime
                //console.log('lastModified: ' + String(lastModified) + ', ' + lastModified)
                if (lastModified.getTime() > lastFetched.getTime()){
                    onModified(addTS(url, lastModified))
                    lastFetchedTimes[url] = lastModified
                }
            }else{
                var sha1 = sha1Hash(this.responseText)
                if (contentHashes[url] != sha1){
                    onModified(randUrl)
                    contentHashes[url] = sha1
                }
            }
        }
    })
}

function refresh(){
    ifModified(mainURL, function(url){
        frame.src = url
    });
    //console.log('cssLinkTags: ' + cssLinkTags.length)
    cssLinkTags.forEach(function(link){
        var url = link.href
        ifModified(url, function(url){
            //console.log('Updated ' + url)
            link.href = url
        });
    })
}

function setFrameHeight(){
    frame.style.height = (window.innerHeight - frame.offsetTop) + 'px'
}
function onWindowResize(){
    setFrameHeight()
}
function setTitle(){
    document.title = 'SuperRefresh - ' + frame.contentDocument.title
}

function onFrameLoaded(e){
    mainURL = frame.contentWindow.location.toString()
    urlBar.innerHTML = stripQS(mainURL)
    frameLoadTime = new Date()
    setTitle()
    var doc = frame.contentDocument
    var frameWindow = frame.contentWindow
    var frameDocument = frame.contentDocument
    /*
    scriptTags = toArray(frameDocument.getElementsByTagName('script'))
        .filter(function(tag){
            return Boolean(tag.src)
        });
    */
    //console.log(scriptTags.map(function(tag){return tag.src }).join("\n"))
    cssLinkTags = toArray(frameDocument.getElementsByTagName('link'))
        .filter(function(tag){
            return tag.rel == 'stylesheet'
        })
    
    
    if (scrollOffset)
        frameWindow.scrollTo(scrollOffset.x, scrollOffset.y)
    
    frameWindow.addEventListener('scroll', function(){
        scrollOffset = {x: frameWindow.pageXOffset, y: frameWindow.pageYOffset}
    }, false)
    //console.log(cssLinkTags.map(function(tag){return tag.href}).join("\n"))
    if (!intervalID)
        intervalID = setInterval(refresh, 1000)
}

function removeChildren(elm){
    toArray(elm.childNodes).forEach(function(child){
        elm.removeChild(child)
    })
}



function blankOutPage(){
    var head = document.getElementsByTagName('head')[0]
    removeChildren(head)
    document.body.innerHTML = ''
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
    window.addEventListener('resize', onWindowResize, false)
}

function init(url){
    mainURL = url
    blankOutPage()
    buildPage()
    frame = document.getElementById('frame')
    frame.addEventListener('load', onFrameLoaded, false)
    frame.src = mainURL
}

