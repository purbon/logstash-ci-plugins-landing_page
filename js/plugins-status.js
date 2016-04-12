function parse_link_header(header) {
    if (header.length === 0) {
        throw new Error("input must not be of zero length");
    }

    // Split parts by comma
    var parts = header.split(',');
    var links = {};
    // Parse each part into a named link
    for(var i=0; i<parts.length; i++) {
        var section = parts[i].split(';');
        if (section.length !== 2) {
            throw new Error("section could not be split on ';'");
        }
        var url = section[0].replace(/<(.*)>/, '$1').trim();
        var name = section[1].replace(/rel="(.*)"/, '$1').trim();
        links[name] = url;
    }
    return links;
}

function load_plugins_list(remote_url) {
  console.log(remote_url);
  if (remote_url == undefined)
    remote_url = "https://api.github.com/orgs/logstash-plugins/repos";
  var cached = lscache.get(remote_url)
  if (cached != null) {
    var next = lscache.get(remote_url+"#next");
    var last = lscache.get(remote_url+"#last");
    append_data(cached, next, last);
  } else {
    $.ajax({
      url: remote_url,
      success: function(data, textStatus, request) {
        var links = parse_link_header(request.getResponseHeader('Link'));
        lscache.set(remote_url, data, 60);
        lscache.set(remote_url+"#next", links.next, 60);
        lscache.set(remote_url+"#last", links.last, 60);
        append_data(data, links.next, links.last);
      },
      dataType: "json"
    });
  }
}

function page_num(link) {
  a = document.createElement("a");
  a.href = link
  return parseInt(a.search.replace("?page=", ""));
}

function append_data(data, next, last) {
  if (page_num(next) <= page_num(last))
    load_plugins_list(next);
  print_data(data)
}

function print_data(data) {
  var open = false;
  var j    = 0;
  for(var i=0; i < data.length; i++) {
    var status = "https://travis-ci.org/logstash-plugins/"+data[i]["name"]+".svg?branch=master"
    if ((j%2==0)&&(open==false)) {
      $("#plugins-status").append("<tr>")
      open = true;
    }
    var github_link = "<a href='https://github.com/logstash-plugins/"+data[i]["name"]+"'>"+data[i]["name"]+"</a>";
    var status_link = "<a href='https://travis-ci.org/logstash-plugins/"+data[i]["name"]+"'><img src='"+status+"'></a>";
    $("#plugins-status tbody tr:last").append("<td>"+github_link+""+status_link+"</td>")
    j = j + 1
    if ((j%2==0)&&(open)) {
      $("#plugins-status").append("</tr>")
      open = false;
      j    = 0;
    }
  }
}

$(document).ready(function() {
    console.log( "ready!" );
    load_plugins_list();
});
