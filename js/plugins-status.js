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

function load_plugins_list(remote_url, list) {
  if (remote_url == undefined)
    remote_url = "https://api.github.com/orgs/logstash-plugins/repos";
  var cached = lscache.get(remote_url)
  if (cached != null) {
    var next = lscache.get(remote_url+"#next");
    var last = lscache.get(remote_url+"#last");
    append_data(cached, next, last, list);
  } else {
    $.ajax({
      url: remote_url,
      success: function(data, textStatus, request) {
        var links = parse_link_header(request.getResponseHeader('Link'));
        lscache.set(remote_url, data, 60);
        lscache.set(remote_url+"#next", links.next, 60);
        lscache.set(remote_url+"#last", links.last, 60);
        append_data(data, links.next, links.last, list);
      },
      dataType: "json"
    });
  }
}



function append_data(data, next, last, list) {
  if (page_num(next) <= page_num(last))
    load_plugins_list(next, list);
  print_data(data, list)
}

function print_data(data, list) {
  var open = false;
  for(var i=0; i < data.length; i++) {
    var plugin_name    = data[i]["name"]
    var default_plugin = list.includes(plugin_name);
    var status         = "https://travis-ci.org/logstash-plugins/"+plugin_name+".svg?branch=master"
    if (default_plugin) {
      var order_id       = $("#default-plugins-status tbody tr:last td").length;
      add_table_cell("#default-plugins-status", plugin_name, status, order_id)
    } else {
      var order_id       = $("#others-plugins-status tbody tr:last td").length;
      add_table_cell("#others-plugins-status", plugin_name, status, order_id)
    }
  }
}

function add_table_cell(class_id, plugin_name, status, order) {
  if (order%2==0) {
    $(class_id).append("<tr>")
  }
  var github_link = "<a href='https://github.com/logstash-plugins/"+plugin_name+"'>"+plugin_name+"</a>";
  var status_link = "<a href='https://travis-ci.org/logstash-plugins/"+plugin_name+"'><img src='"+status+"'></a>";
  $(class_id+" tbody tr:last").append("<td>"+github_link+""+status_link+"</td>")
  order = order + 1
  if (order%2==0) {
    $(class_id).append("</tr>")
  }
}

$(document).ready(function() {
    var default_plugins_list_url = "https://raw.githubusercontent.com/purbon/logstash/feature/make_list_as_json/rakelib/default_plugins.json"
    $.get(default_plugins_list_url, function(list) {
      load_plugins_list(undefined, JSON.parse(list).default_plugins);
    });
});

function page_num(link) {
  a = document.createElement("a");
  a.href = link
  return parseInt(a.search.replace("?page=", ""));
}
