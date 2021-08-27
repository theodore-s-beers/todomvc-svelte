/* global location, XMLHttpRequest */

(function () {
  'use strict'

  // Underscore's Template Module
  // Courtesy of underscorejs.org
  const _ = (function (_) {
    _.defaults = function (object) {
      if (!object) {
        return object
      }
      for (
        let argsIndex = 1, argsLength = arguments.length;
        argsIndex < argsLength;
        argsIndex++
      ) {
        const iterable = arguments[argsIndex]
        if (iterable) {
          for (const key in iterable) {
            if (object[key] == null) {
              object[key] = iterable[key]
            }
          }
        }
      }
      return object
    }

    // By default, Underscore uses ERB-style template delimiters, change the
    // following template settings to use alternative delimiters.
    _.templateSettings = {
      evaluate: /<%([\s\S]+?)%>/g,
      interpolate: /<%=([\s\S]+?)%>/g,
      escape: /<%-([\s\S]+?)%>/g
    }

    // When customizing `templateSettings`, if you don't want to define an
    // interpolation, evaluation or escaping regex, we need one that is
    // guaranteed not to match.
    const noMatch = /(.)^/

    // Certain characters need to be escaped so that they can be put into a
    // string literal.
    const escapes = {
      "'": "'",
      '\\': '\\',
      '\r': 'r',
      '\n': 'n',
      '\t': 't',
      '\u2028': 'u2028',
      '\u2029': 'u2029'
    }

    const escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g

    // JavaScript micro-templating, similar to John Resig's implementation.
    // Underscore templating handles arbitrary delimiters, preserves whitespace,
    // and correctly escapes quotes within interpolated code.
    _.template = function (text, data, settings) {
      let render
      settings = _.defaults({}, settings, _.templateSettings)

      // Combine delimiters into one regular expression via alternation.
      const matcher = new RegExp(
        [
          (settings.escape || noMatch).source,
          (settings.interpolate || noMatch).source,
          (settings.evaluate || noMatch).source
        ].join('|') + '|$',
        'g'
      )

      // Compile the template source, escaping string literals appropriately.
      let index = 0
      let source = "__p+='"
      text.replace(
        matcher,
        function (match, escape, interpolate, evaluate, offset) {
          source += text
            .slice(index, offset)
            .replace(escaper, function (match) {
              return '\\' + escapes[match]
            })

          if (escape) {
            source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'"
          }
          if (interpolate) {
            source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'"
          }
          if (evaluate) {
            source += "';\n" + evaluate + "\n__p+='"
          }
          index = offset + match.length
          return match
        }
      )
      source += "';\n"

      // If a variable is not specified, place data values in local scope.
      if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n'

      source =
        "var __t,__p='',__j=Array.prototype.join," +
        "print=function(){__p+=__j.call(arguments,'');};\n" +
        source +
        'return __p;\n'

      try {
        // eslint-disable-next-line no-new-func
        render = new Function(settings.variable || 'obj', '_', source)
      } catch (e) {
        e.source = source
        throw e
      }

      if (data) return render(data, _)
      const template = function (data) {
        return render.call(this, data, _)
      }

      // Provide the compiled function source as a convenience for precompilation.
      template.source =
        'function(' + (settings.variable || 'obj') + '){\n' + source + '}'

      return template
    }

    return _
  })({})

  function redirect () {
    if (location.hostname === 'tastejs.github.io') {
      location.href = location.href.replace(
        'tastejs.github.io/todomvc',
        'todomvc.com'
      )
    }
  }

  function findRoot () {
    const base = location.href.indexOf('examples/')
    return location.href.substr(0, base)
  }

  // eslint-disable-next-line no-unused-vars
  function getFile (file, callback) {
    if (!location.host) {
      return console.info(
        'Miss the info bar? Run TodoMVC from a server to avoid a cross-origin error.'
      )
    }

    const xhr = new XMLHttpRequest()

    xhr.open('GET', findRoot() + file, true)
    xhr.send()

    xhr.onload = function () {
      if (xhr.status === 200 && callback) {
        callback(xhr.responseText)
      }
    }
  }

  function Learn (learnJSON, config) {
    if (!(this instanceof Learn)) {
      return new Learn(learnJSON, config)
    }

    let template, framework

    if (typeof learnJSON !== 'object') {
      try {
        learnJSON = JSON.parse(learnJSON)
      } catch (e) {
        return
      }
    }

    if (config) {
      template = config.template
      framework = config.framework
    }

    if (!template && learnJSON.templates) {
      template = learnJSON.templates.todomvc
    }

    if (!framework && document.querySelector('[data-framework]')) {
      framework = document.querySelector('[data-framework]').dataset.framework
    }

    this.template = template

    if (learnJSON.backend) {
      this.frameworkJSON = learnJSON.backend
      this.frameworkJSON.issueLabel = framework
      this.append({
        backend: true
      })
    } else if (learnJSON[framework]) {
      this.frameworkJSON = learnJSON[framework]
      this.frameworkJSON.issueLabel = framework
      this.append()
    }

    this.fetchIssueCount()
  }

  Learn.prototype.append = function (opts) {
    const aside = document.createElement('aside')
    aside.innerHTML = _.template(this.template, this.frameworkJSON)
    aside.className = 'learn'

    if (opts && opts.backend) {
      // Remove demo link
      const sourceLinks = aside.querySelector('.source-links')
      const heading = sourceLinks.firstElementChild
      const sourceLink = sourceLinks.lastElementChild
      // Correct link path
      const href = sourceLink.getAttribute('href')
      sourceLink.setAttribute('href', href.substr(href.lastIndexOf('http')))
      sourceLinks.innerHTML = heading.outerHTML + sourceLink.outerHTML
    } else {
      // Localize demo links
      const demoLinks = aside.querySelectorAll('.demo-link')
      Array.prototype.forEach.call(demoLinks, function (demoLink) {
        if (demoLink.getAttribute('href').substr(0, 4) !== 'http') {
          demoLink.setAttribute(
            'href',
            findRoot() + demoLink.getAttribute('href')
          )
        }
      })
    }

    document.body.className = (document.body.className + ' learn-bar').trim()
    document.body.insertAdjacentHTML('afterBegin', aside.outerHTML)
  }

  Learn.prototype.fetchIssueCount = function () {
    const issueLink = document.getElementById('issue-count-link')
    if (issueLink) {
      const url = issueLink.href.replace(
        'https://github.com',
        'https://api.github.com/repos'
      )
      const xhr = new XMLHttpRequest()
      xhr.open('GET', url, true)
      xhr.onload = function (e) {
        const parsedResponse = JSON.parse(e.target.responseText)
        if (parsedResponse instanceof Array) {
          const count = parsedResponse.length
          if (count !== 0) {
            issueLink.innerHTML = 'This app has ' + count + ' open issues'
            document.getElementById('issue-count').style.display = 'inline'
          }
        }
      }
      xhr.send()
    }
  }

  redirect()
})()
