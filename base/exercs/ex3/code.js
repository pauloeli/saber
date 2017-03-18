'use strict';

var Code = {};

Code.LANGUAGE_NAME = {'pt-br': 'Português Brasileiro'};

Code.LANGUAGE_RTL = [];
Code.workspace = null;

Code.getStringParamFromUrl = function (name, defaultValue) {
    var val = location.search.match(new RegExp('[?&]' + name + '=([^&]+)'));
    return val ? decodeURIComponent(val[1].replace(/\+/g, '%20')) : defaultValue;
};

Code.loadBlocks = function (defaultXml) {
    try {
        var loadOnce = window.sessionStorage.loadOnceBlocks;
    } catch (e) {
        var loadOnce = null;
    }
    if ('BlocklyStorage' in window && window.location.hash.length > 1) {
        BlocklyStorage.retrieveXml(window.location.hash.substring(1));
    } else if (loadOnce) {
        delete window.sessionStorage.loadOnceBlocks;
        var xml = Blockly.Xml.textToDom(loadOnce);
        Blockly.Xml.domToWorkspace(Code.workspace, xml);
    } else if (defaultXml) {
        var xml = Blockly.Xml.textToDom(defaultXml);
        Blockly.Xml.domToWorkspace(Code.workspace, xml);
    } else if ('BlocklyStorage' in window) {
        window.setTimeout(BlocklyStorage.restoreBlocks, 0);
    }
};

Code.bindClick = function (el, func) {
    if (typeof el == 'string') {
        el = document.getElementById(el);
    }
    el.addEventListener('click', func, true);
    el.addEventListener('touchend', func, true);
};

Code.importPrettify = function () {
    var link = document.createElement('link');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('href', '../prettify.css');
    document.head.appendChild(link);
    var script = document.createElement('script');
    script.setAttribute('src', '../prettify.js');
    document.head.appendChild(script);
};

Code.getBBox_ = function (element) {
    var height = element.offsetHeight;
    var width = element.offsetWidth;
    var x = 0;
    var y = 0;
    do {
        x += element.offsetLeft;
        y += element.offsetTop;
        element = element.offsetParent;
    } while (element);
    return {
        height: height,
        width: width,
        x: x,
        y: y
    };
};

Code.LANG = 'pt-br';
Code.TABS_ = ['blocks', 'javascript', 'xml'];
Code.selected = 'blocks';

Code.tabClick = function (clickedName) {
    if (document.getElementById('tab_xml').className == 'tabon') {
        var xmlTextarea = document.getElementById('content_xml');
        var xmlText = xmlTextarea.value;
        var xmlDom = null;
        try {
            xmlDom = Blockly.Xml.textToDom(xmlText);
        } catch (e) {
            var q =
                window.confirm(MSG['badXml'].replace('%1', e));
            if (!q) {
                return;
            }
        }
        if (xmlDom) {
            Code.workspace.clear();
            Blockly.Xml.domToWorkspace(Code.workspace, xmlDom);
        }
    }

    if (document.getElementById('tab_blocks').className == 'tabon') {
        Code.workspace.setVisible(false);
    }

    for (var i = 0; i < Code.TABS_.length; i++) {
        var name = Code.TABS_[i];
        document.getElementById('tab_' + name).className = 'taboff';
        document.getElementById('content_' + name).style.visibility = 'hidden';
    }

    Code.selected = clickedName;
    document.getElementById('tab_' + clickedName).className = 'tabon';
    document.getElementById('content_' + clickedName).style.visibility = 'visible';

    Code.renderContent();
    if (clickedName == 'blocks') {
        Code.workspace.setVisible(true);
    }

    Blockly.fireUiEvent(window, 'resize');
};

Code.renderContent = function () {
    var content = document.getElementById('content_' + Code.selected);
    if (content.id == 'content_xml') {
        var xmlTextarea = document.getElementById('content_xml');
        var xmlDom = Blockly.Xml.workspaceToDom(Code.workspace);
        var xmlText = Blockly.Xml.domToPrettyText(xmlDom);
        xmlTextarea.value = xmlText;
        xmlTextarea.focus();
    } else if (content.id == 'content_javascript') {
        var code = Blockly.JavaScript.workspaceToCode(Code.workspace);
        content.textContent = code;
        if (typeof prettyPrintOne == 'function') {
            code = content.innerHTML;
            code = prettyPrintOne(code, 'js');
            content.innerHTML = code;
        }
    }
};

Code.init = function () {
    Code.initLanguage();
    var container = document.getElementById('content_area');
    var onresize = function (e) {
        var bBox = Code.getBBox_(container);
        for (var i = 0; i < Code.TABS_.length; i++) {
            var el = document.getElementById('content_' + Code.TABS_[i]);
            el.style.top = bBox.y + 'px';
            el.style.left = bBox.x + 'px';
            el.style.height = bBox.height + 'px';
            el.style.height = (2 * bBox.height - el.offsetHeight) + 'px';
            el.style.width = bBox.width + 'px';
            el.style.width = (2 * bBox.width - el.offsetWidth) + 'px';
        }

        if (Code.workspace && Code.workspace.toolbox_.width) {
            document.getElementById('tab_blocks').style.minWidth = (Code.workspace.toolbox_.width - 38) + 'px';
        }
    };

    onresize();
    window.addEventListener('resize', onresize, false);

    var toolbox = document.getElementById('toolbox');
    Code.workspace = Blockly.inject('content_blocks', {
        grid: {
            spacing: 25,
            length: 3,
            colour: '#ccc',
            snap: true
        },
        media: '../../media/',
        toolbox: toolbox,
        zoom: {
            controls: true,
            wheel: true
        }
    });

    Blockly.JavaScript.addReservedWords('code,timeouts,checkTimeout');

    Code.loadBlocks('');

    if ('BlocklyStorage' in window) {
        BlocklyStorage.backupOnUnload(Code.workspace);
    }

    Code.tabClick(Code.selected);

    Code.bindClick('trashButton',
        function () {
            Code.discard();
            Code.renderContent();
        });

    Code.bindClick('runButton', Code.runJS);

    var linkButton = document.getElementById('linkButton');
    if ('BlocklyStorage' in window) {
        BlocklyStorage['HTTPREQUEST_ERROR'] = MSG['httpRequestError'];
        BlocklyStorage['LINK_ALERT'] = MSG['linkAlert'];
        BlocklyStorage['HASH_ERROR'] = MSG['hashError'];
        BlocklyStorage['XML_ERROR'] = MSG['xmlError'];
        Code.bindClick(linkButton,
            function () {
                BlocklyStorage.link(Code.workspace);
            });
    } else if (linkButton) {
        linkButton.className = 'disabled';
    }

    for (var i = 0; i < Code.TABS_.length; i++) {
        var name = Code.TABS_[i];
        Code.bindClick('tab_' + name,
            function (name_) {
                return function () {
                    Code.tabClick(name_);
                };
            }(name));
    }

    window.setTimeout(Code.importPrettify, 1);
};

Code.initLanguage = function () {
    document.dir = 'ltr';
    document.head.parentElement.setAttribute('lang', Code.LANG);

    var languages = [];
    for (var lang in Code.LANGUAGE_NAME) {
        languages.push([Code.LANGUAGE_NAME[lang], lang]);
    }

    var comp = function (a, b) {
        if (a[0] > b[0]) return 1;
        if (a[0] < b[0]) return -1;
        return 0;
    };

    document.getElementById('tab_blocks').textContent = MSG['blocks'];
    document.getElementById('runButton').title = MSG['runTooltip'];
    document.getElementById('trashButton').title = MSG['trashTooltip'];

    var categories = ['catLogic', 'catMath', 'catText', 'catVariables'];
    for (var i = 0, cat; cat = categories[i]; i++) {
        document.getElementById(cat).setAttribute('name', MSG[cat]);
    }

    var textVars = document.getElementsByClassName('textVar');
    for (var i = 0, textVar; textVar = textVars[i]; i++) {
        textVar.textContent = MSG['textVariable'];
    }

    var listVars = document.getElementsByClassName('listVar');
    for (var i = 0, listVar; listVar = listVars[i]; i++) {
        listVar.textContent = MSG['listVariable'];
    }

};

Code.runJS = function () {
    Blockly.JavaScript.INFINITE_LOOP_TRAP = '  checkTimeout();\n';
    var timeouts = 0;
    var checkTimeout = function () {
        if (timeouts++ > 1000000) {
            throw MSG['timeout'];
        }
    };
    var code = Blockly.JavaScript.workspaceToCode(Code.workspace);
    Blockly.JavaScript.INFINITE_LOOP_TRAP = null;
    try {
        eval(code);
    } catch (e) {
        alert(MSG['badCode'].replace('%1', e));
    }
};

Code.discard = function () {
    var count = Code.workspace.getAllBlocks().length;
    if (count < 2 || window.confirm(Blockly.Msg.DELETE_ALL_BLOCKS.replace('%1', count))) {
        Code.workspace.clear();
        if (window.location.hash) {
            window.location.hash = '';
        }
    }
};

document.write('<script src="' + Code.LANG + '.js"></script>\n');
document.write('<script src="../../msg/js/' + Code.LANG + '.js"></script>\n');

window.addEventListener('load', Code.init);