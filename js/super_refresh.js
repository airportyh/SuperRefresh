var mainURL, frame, frameDocument, scriptTags, cssLinkTags
var frameLoadTime, intervalID
var lastFetchedTimes = {}

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
    ajax(addRandom(url), 'GET', function(){
        if (this.readyState == 4){
            //console.log('xhr finished.')
            var lastModified = new Date(this.getResponseHeader('Last-Modified'))
            var lastFetched = lastFetchedTimes[url] || frameLoadTime
            console.log('lastModified: ' + String(lastModified) + ', ' + lastModified)
            if (String(lastModified.getTime()) == "NaN" || 
                lastModified.getTime() > lastFetched.getTime()){
                onModified(addTS(url, lastModified))
                lastFetchedTimes[url] = lastModified
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

function onFrameLoaded(){
    frameLoadTime = new Date()
    var doc = frame.contentDocument
    frameDocument = frame.contentDocument
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
        });
        
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
    	top: 2.8em;\
    	width: 100%;\
    	height: 100%;\
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
        margin: 0; padding: 0;\
    	color: #8cc21f;\
    	margin-left: 0.2em;\
    }\
    h1 span{\
    	color: #4ca1cc;\
    }'
	var style = document.createElement('style')
	style.type = 'text/css'
	style.appendChild(document.createTextNode(css))
	var head = document.getElementsByTagName('head')[0]
	var title = document.createElement('title')
	title.appendChild(document.createTextNode('superrefresh'))
	head.appendChild(title)
	head.appendChild(style)
    
    document.body.innerHTML = '<h1><span>super</span>refresh</h1>\
        <iframe id="frame"></iframe>'
}

function init(url){
    mainURL = url
    blankOutPage()
    buildPage()
    frame = document.getElementById('frame')
    frame.addEventListener('load', onFrameLoaded, false)
    frame.src = mainURL
}

