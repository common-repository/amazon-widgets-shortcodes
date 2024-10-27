(function() {
  tinymce.PluginManager.requireLangPack('wpAwshortcode');

  tinymce.create('tinymce.plugins.wpAwshortcodePlugin', {
    /**
     * Initializes the plugin, this will be executed after the plugin has been created.
     * This call is done before the editor instance has finished it's initialization so use the onInit event
     * of the editor instance to intercept that event.
     *
     * @param {tinymce.Editor} ed Editor instance that the plugin is initialized in.
     * @param {string} url Absolute URL to where the plugin is located.
     */
    init : function(ed, url) {
      var t = this;

      ed.addCommand('wpAwshortcodeSelector', function(ui, val) {
        /*
         * Popup arguments
         */
        var popupArgs = [];
        popupArgs.push('tinymce='+escape(tinymce.baseURL.replace(/^.+:\/\//, '//')));

        ed.windowManager.open({
          file : url + '/shortcode-'+val+'.html?'+popupArgs.join('&'),
          width : 450 + 'px',
          height : 490 + 'px',
          inline : 1
        }, {
          plugin_url: url,
          shortcode:  val,
          widget:     val.replace(/amazon-/, '')
        });
      });

      /*
       * Load additional CSS
       */
      ed.onInit.add(function() {
        if (ed.settings.content_css !== false)
        {
          dom = ed.windowManager.createInstance('tinymce.dom.DOMUtils', document);
          /*
           * Load first for the viewport
           * And then, inside the RTE frame
           */
          dom.loadCSS(url + '/css/content.css');
          ed.dom.loadCSS(url + '/css/content.css');
        }
      });

      /*
       * Select the item on node change
       */
      ed.onNodeChange.add(function(ed){
        t._selectMenu(ed);
      });

      /*
       * From Editor to database (Visual to HTML tab)
       *
       * We basically remove span element
       */
      ed.onBeforeGetContent.add(function(ed, o){
        tinymce.each(ed.getBody().getElementsByTagName('span'), function(tag){
          if (ed.dom.hasClass(tag, 'awshortcode'))
          {
            tag.innerHTML = tag.innerHTML.replace(/<\/?[^>]*>/g, '');
          }
        });
      });

      /*
       * From Editor to database (Visual to HTML tab)
       *
       * We basically remove span element
       */
      ed.onPostProcess.add(function(ed, o){
        o.content = o.content.replace(
          /<span class="awshortcode [^>]+>([^<>]+)<\/span>/g,
          function (text, shortcode)
          {
            return shortcode;
          }
        );
      });
      /*
       * From database to Editor (HTML tab to Visual)
       *
       * We encapsulate shortcode in span elements
       *
       * @todo it seems a bit dirty
       * Maybe for speed reasons; doing a getBody() + replace + setBody() does not work
       */
      ed.onSetContent.add(function(ed, o){
        var body = ed.getBody();

        /*
         * Check if there are already shortcode
         *
         * Avoid undo/redo problem without bloating the code with other ed.onXXX events
         * Or when the code is copy paster in plain HTML, could happens!
         */
        if (/<span class="awshortcode amazon-[0-9a-z]+">/.test(body.innerHTML))
        {
          return;
        }

        body.innerHTML = body.innerHTML.replace(
          /(\[amazon-[a-z0-9]+[^\]]*\][^\[]+\[\/(amazon-[a-z0-9]+)\])/g,
          function(text, shortcode, widget_id){
            return '<span class="awshortcode '+widget_id+'">'+shortcode+'</span>';
          }
        );
      });
    },

    /**
     * Creates control instances based in the incomming name. This method is normally not
     * needed since the addButton method of the tinymce.Editor class is a more easy way of adding buttons
     * but you sometimes need to create more complex controls like listboxes, split buttons etc then this
     * method can be used to create those.
     *
     * @param {String} n Name of the control to create.
     * @param {tinymce.ControlManager} cm Control manager to use inorder to create new control.
     * @return {tinymce.ui.Control} New control instance or null if no control was created.
     */
    createControl : function(n, cm) {
      var t = this, menu = t._cache.menu, c, ed = tinyMCE.activeEditor, each = tinymce.each;

      if (n != 'awshortcode-selector')
      {
        return null;
      }

      c = cm.createSplitButton(n, {
        cmd:    '',
        scope : t,
        title : 'wpAwshortcode.desc'
      });

      c.onRenderMenu.add(function(c, m) {
        m.add({
          'class': 'mceMenuItemTitle',
          title:   'wpAwshortcode.desc'
        }).setDisabled(1);

        each(ed.settings.awshortcode_enabled_widgets.split(','), function(key) {
          var o = {icon : 0}, mi,
              label = 'wpAwshortcode.' + key.replace('-', '_');

          o.onclick = function() {
            ed.execCommand('wpAwshortcodeSelector', true, key);
          };

          o.title = label;
          mi = m.add(o);
          menu[key] = mi;
        });

        t._selectMenu(ed);
      });

      return c;
    },
    /**
     * Shortcodes list
     *
     * @since 1.1
     */
    shortcodes: {
      'amazon-carrousel':     'wpAwshortcode.amazon_carrousel',
      'amazon-deals':         'wpAwshortcode.amazon_deals',
      'amazon-mp3':           'wpAwshortcode.amazon_mp3',
      'amazon-myfavorites':   'wpAwshortcode.amazon_myfavorites',
      'amazon-product':       'wpAwshortcode.amazon_product',
      'amazon-productcloud':  'wpAwshortcode.amazon_productcloud',
      'amazon-slideshow':     'wpAwshortcode.amazon_slideshow',
      'amazon-wishlist':      'wpAwshortcode.amazon_wishlist'
    },
    /**
     * Returns information about the plugin as a name/value array.
     * The current keys are longname, author, authorurl, infourl and version.
     *
     * @return {Object} Name/value array containing information about the plugin.
     */
    getInfo : function() {
      return {
        longname:  'Amazon Widgets Shortcodes',
        author:    'Oncle Tom',
        authorurl: 'http://oncle-tom.net',
        infourl:   'http://wordpress.org/extend/plugins/amazon-widgets-shortcodes/',
        version:   '1.6'
      };
    },
    /*
     * Private controls
     */
    /*
     * Cache references
     */
    _cache: {
      menu: {}
    },
    /**
     * Select an item menu based on its classname
     *
     * @since 1.1
     * @version 1.0
     * @param {Object} ed TinyMCE Editor reference
     */
    _selectMenu: function(ed){
      var fe  =  ed.selection.getNode(), each = tinymce.each, menu = this._cache.menu;

      each(this.shortcodes, function(value, key){
        if (typeof menu[key] == 'undefined' || !menu[key])
        {
          return;
        }

        menu[key].setSelected(ed.dom.hasClass(fe, key));
      });
    }
  });

  // Register plugin
  tinymce.PluginManager.add('wpAwshortcode', tinymce.plugins.wpAwshortcodePlugin);
})();