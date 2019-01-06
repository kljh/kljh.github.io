// ==UserScript==
// @name         Symphony Augmented Reality for Tampermonkey
// @version      0.1
// @description  Add extra information to message received. It's not a bot. Evevrything happens on client side, augmenting message received/
// @author       code@main2.fr
// @match        https://my.symphony.com/client/*
// @require      https://cdn.jsdelivr.net/npm/arrive@2.4.1/src/arrive.js
// @grant        none
// ==/UserScript==

(function() {
'use strict';

// register change handler

if (typeof document != "undefined") {
    setTimeout(function () {
        register_change_handler();
    }, 1000);
}

function register_change_handler() {
    try {
        document.arrive(".message", onMsgArrived);
        console.log("register_change_handler OK");
    } catch (e) {
        console.error("register_change_handler ERROR "+e);
    }
}

function onMsgArrived(elnt) {
    var ts = new Date().toLocaleTimeString();
    //console.log("arrived", new Date().toLocaleTimeString(), elnt);

    for (var fct of fcts) {
        var html_before = elnt.innerHTML;
        var html_after = fct(elnt, html_before);

        if (html_after && html_after != html_before) {
            console.log("arrived", ts, "SUBSTITUTION");
            elnt.innerHTML = html_after;
        }
    }
}

var fcts;
function update_substitutions_function() {
    // initialize once
    if (!fcts) fcts = [];

    // update keeping reference constant
    while (fcts.length) fcts.pop();
    fcts.push(bingo_substitution);
    fcts.push(city_weather_substitution);
};
update_substitutions_function();

var bingo_regexps = {
    synergy: /[Ss]ynerg[yies]*/,
    bot: /([Ch]at|[Rr]o|\s)bot[iszation]*\s/,
    digitalisation: /[Dd]igital[isaton]*/,
    blockchain: /[Bb]loc\s*[Cc]hain[s]*/,
    AI: /\sAI\s/,
    disrupt: /[Dd]isrupt[iveonr]*/,
    innovation: /[Ii]nnovation/,
    initiative: /[Ii]nitiative/,
    mining: /([Dd]ata )?[Mm]ining/,
    cards: /[Cc]ards/,
    connected: /[Cc]onnected/,
    communities: /[Cc]ommunit(ies|y)/,
    "2.0": /\s2\.0\s/,

    };
var bingo_regexp = new RegExp( "(" + Object.keys(bingo_regexps).map((k,i,v) => bingo_regexps[k].source).join("|") + ")", "g" );


var bingo_found = {};
function bingo_substitution(elnt, html_before) {
    var user_id = get_user_info(elnt);

    if (!bingo_found[user_id]) bingo_found[user_id] = {};

    var poo = '<span style="color: orange;">&nbsp;&#x1F4A9;&nbsp;</span>';
    var html_after = html_before.replace(bingo_regexp, function(a, b, c, d) {
        //console.log(Array.from(arguments));
        var found_key = undefined;
        for (var k in bingo_regexps) {
            var exact_re = new RegExp("^"+bingo_regexps[k].source+"$");
            if (exact_re.test(a))
                found_key = k;
        }
        if (!found_key)
            return a;
        bingo_found[user_id][found_key] = true;
        return poo + a + poo;
    });

    if (html_after==html_before) {
        // nothing to do, return
        return;
    } else {
        // return html and let calling function do the DOM subtitution
        // return html_after;
    }

    // we do DOM augmentation

    var body_wrapper = elnt.querySelector(".message__body-wrapper");

    var grid = [
        [ "AI", "mining", "disrupt", "innovation" ],
        [ "blockchain", "synergy", "digitalisation", "bot" ],
        [ "2.0", "connected", "cards", "initiative" ],
        ];

    var css_found = " background-color: coral;";
    var html_table = '<table style="max-width:450px; border: 1px solid lightgray; ; border-collapse: collapse;">'
        + grid.map(row => '<tr>'+row.map(val => '<td style="text-align: center; padding: 2px 10px;'+(bingo_found[user_id][val]?css_found:'')+'">'+val+'</td>').join('')+'</tr>').join('')
        + '</table>';

    // https://commons.wikimedia.org/wiki/Category:Sound_sample_files
    // Crash, Ride
    var html_audio = '<p><audio controls><source src="https://upload.wikimedia.org/wikipedia/commons/6/68/Crash.ogg" type="audio/ogg"/></audio></p>';

    var html = html_table + (bingo_found[user_id].length>10?html_audio:"");
    $(body_wrapper).append(html);
}


var cities = [ "London", "Paris", "Tokyo", "Lisbon", "New York", "Chicago", "Montreal", "Québec", "Clamart", "Okinawa" ];
var city_regexp = new RegExp( "("+cities.join("|")+")", "gi" );

var weather_info = {
    "London" : {"coord":{"lon":-0.13,"lat":51.51},"weather":[{"id":800,"main":"Clear","description":"clear sky","icon":"01d"}],"base":"stations","main":{"temp":288.85,"pressure":1030,"humidity":44,"temp_min":287.15,"temp_max":290.15},"visibility":10000,"wind":{"speed":6.2,"deg":60},"clouds":{"all":0},"dt":1538146200,"sys":{"type":1,"id":5091,"message":0.0027,"country":"GB","sunrise":1538114226,"sunset":1538156633},"id":2643743,"name":"London","cod":200},
    "Paris" : {"coord":{"lon":2.35,"lat":48.86},"weather":[{"id":803,"main":"Clouds","description":"broken clouds","icon":"04d"}],"base":"stations","main":{"temp":289.86,"pressure":1026,"humidity":59,"temp_min":289.15,"temp_max":290.15},"visibility":10000,"wind":{"speed":7.2,"deg":20},"clouds":{"all":75},"dt":1538152200,"sys":{"type":1,"id":5610,"message":0.0041,"country":"FR","sunrise":1538113591,"sunset":1538156082},"id":2988507,"name":"Paris","cod":200},
    "Tokyo" : {"coord":{"lon":139.76,"lat":35.68},"weather":[{"id":741,"main":"Fog","description":"fog","icon":"50n"}],"base":"stations","main":{"temp":290.94,"pressure":1020,"humidity":82,"temp_min":289.15,"temp_max":293.15},"visibility":10000,"wind":{"speed":3.1,"deg":160},"clouds":{"all":40},"dt":1538150400,"sys":{"type":1,"id":7619,"message":0.0033,"country":"JP","sunrise":1538080418,"sunset":1538123332},"id":1850147,"name":"Tokyo","cod":200},
    };

function load_live_weather_infos() {
    // ANTICIPATE CORS ISSUES
    var weather_app_id = "1ad55407beef17a481d49b8955756fe7";
    function load_weather_info(city) {
        var weather_url = "https://api.openweathermap.org/data/2.5/weather?q="+city+"&appid="+weather_app_id;
        $.ajax({ url: weather_url, dataType: "json", xhrFields: { withCredentials: false } })
            .done(function (data) { weather_info[city] = data;})
            .fail();
    }
    for (var city of cities)
        load_weather_info(city)
}

if (typeof document != "undefined") {
    // ANTICIPATE CORS ISSUES
    load_live_weather_infos();
}

var weather_description_icons = {
    "clear sky": "&#x2600;",
    "few clouds": "&#x26C5;",
    "scattered clouds": "&#x2601;",
    "broken clouds": "&#x2601;", // dark cloud
    "shower rain": "&#x2614;",
    "rain": "&#x2614;",
    "thunderstorm": "&#x26c8;",
    "snow": "&#x2744;",
    "mist": "&#x1f301;",
    };

function city_weather_substitution(elnt, html_before) {
    var time_info = get_time_info(elnt);

    var html_after = html_before.replace(city_regexp, function(a, b, c, d) {
        var city = a;

        var weather_span = '<span style="color: orange;">&nbsp;?? &#x2600;&#x2601;&#x26C5;&#x2614;&#x2744; ??&nbsp;</span>'
        if (weather_info[city]) {
            var info = weather_info[city];
            var main = info.weather[0].main;
            var desc = info.weather[0].description;

            weather_span = '<span style="color: grey;"> '
                + (weather_description_icons[desc]||'') + ' '
                //+ '<img src="http://openweathermap.org/img/w/'+info.weather[0].icon+'.png">'
                + main + ' '
                + Math.round(info.main.temp-273.15) + '&#176;C '
                + info.wind.speed + 'm/s '
                + (info.sys && info.sys.country || '' ) + ' '
                + '</span>'
        }

        return city + weather_span;
    });

    if (html_after!=html_before)
        return html_after;
}

function get_user_info(elnt) {
    var display_name = elnt.querySelector(".display-name");
    if (!display_name) {
        console.warn("No .display-name", elnt.innerHTML);
        return;
    }
    var user_name = display_name.innerText;
    var user_id = display_name.getAttribute("data-userid");
    return user_name;
}

function get_time_info(elnt) {
    var elnt_time_ago = elnt.querySelector(".time-ago");
    var elnt_now = elnt.querySelector(".nowTimestamp");
    var timestamp;
    if (elnt_now) {
        return new Date();
    } else if (elnt_time_ago) {
        var iso = elnt_time_ago.getAttribute("datatime");
        return new Date(iso);
    } else {
        console.warn("no time information", elnt.innerHTML);
    }
}

})();