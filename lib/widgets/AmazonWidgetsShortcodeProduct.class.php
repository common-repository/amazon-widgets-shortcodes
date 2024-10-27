<?php
/**
 * @author oncletom
 */

class AmazonWidgetsShortcodeProduct extends AmazonWidgetsShortcodeBase
{
  /**
   * @see AmazonWidgetsShortcode::displayAsHtml()
   * @see AmazonWidgetsShortcodeBase::displayAsHtml()
   */
  function displayAsHtml($attributes, $value = null)
  {
    return parent::displayAsHtml($attributes, $value, __CLASS__);
  }

  /**
   * @see AmazonWidgetsShortcode::shortcodeToHtml()
   */
  function shortcodeToHtml($attributes, $value = null)
  {
    $attributes = shortcode_atts(
      array(
        'align' => get_option('awshortcode_align'),
        'alink' => '00f',
        'alt' => '',
        'bgcolor' => 'fff',
        'bordercolor' => '000',
        'color' => '000',
        'height' => '240',
        'image' => '',
        'region' => get_option('awshortcode_region'),
        'tracking_id' => get_option('awshortcode_tracking_id'),
        'small' => 0,
        'target' => '_blank',
        'text' => '',
        'type' => 'both',
        'width' => '120',
      ),
      $attributes
    );

    $config = AmazonWidgetsShortcodeConfiguration::getShortcode('product');
    $region = AmazonWidgetsShortcodeConfiguration::getRegion($attributes['region']);
    $attributes['type'] = isset($config['types'][$attributes['type']]) ? $attributes['type'] : $config['default_type'];

    $attributes['tracking_image'] = call_user_func(array(__CLASS__, 'getTrackingImage'),
      $region,
      array(
        't' => $attributes['tracking_id'],
        'l' => 'as2',
        'o' => 8,
        'a' => $value,
      )
    );

    /*
     * Display
     */
    return call_user_func(
      array(__CLASS__, 'shortcodeToHtml'.ucfirst($attributes['type'])),
      $attributes,
      $value,
      $region
    );
  }

  /**
   * Display as full widget
   * @see AmazonWidgetsShortcode::shortcodeToHtml()
   */
  function shortcodeToHtmlBoth($attributes, $value, $region_settings)
  {
    extract($attributes);
    $uri = sprintf(
             $region_settings['url']['widget-product'],
             $tracking_id,
             $value,
             call_user_func(array(__CLASS__, 'getHexadecimalFromString'), $color, false),
             (int)$small === 0 ? 'IS2' : 'IS1',
             $target,
             call_user_func(array(__CLASS__, 'getHexadecimalFromString'), $alink, false),
             call_user_func(array(__CLASS__, 'getHexadecimalFromString'), $bordercolor, false),
             call_user_func(array(__CLASS__, 'getHexadecimalFromString'), $bgcolor, false)
           );

    if (get_option('awshortcode_strict_standards'))
    {
      return
        '<div class="awshortcode-product align'.$align.'">'.
          '<object type="text/html" data="'.$uri.'" style="width:'.$width.'px;height:'.$height.'px;">'.
          '</object>'.
        '</div>';
    }
    else
    {
      return
        '<div class="awshortcode-product align'.$align.'">'.
          '<iframe src="'.$uri.'" style="width:'.$width.'px;height:'.$height.'px;" '.
            'scrolling="no" marginwidth="0" marginheight="0" frameborder="0">'.
          '</iframe>'.
        '</div>';
    }
  }

  /**
   * Display as image widget
   * @see AmazonWidgetsShortcode::shortcodeToHtml()
   */
  function shortcodeToHtmlImage($attributes, $value, $region_settings)
  {
    extract($attributes);

    if (!preg_match('/^https?/', $image))
    {
      $image = sprintf($region_settings['url']['images'], $image);
    }

    $uri = sprintf(
             $region_settings['url']['product'],
             $value,
             $tracking_id
    );

    return
      '<a href="'.$uri.'" class="awshortcode-product awshortcode-product-image" rel="external">'.
        '<img src="'.$image.'" alt="'.$alt.'" />'.
        $tracking_image.
      '</a>';
  }

  /**
   * Display as text widget
   * @see AmazonWidgetsShortcode::shortcodeToHtml()
   */
  function shortcodeToHtmlText($attributes, $value, $region_settings)
  {
    extract($attributes);

    $uri = sprintf(
             $region_settings['url']['product'],
             $value,
             $tracking_id
    );

    return
      '<a href="'.$uri.'" class="awshortcode-product awshortcode-product-text" rel="external">'.
        $text.
        $tracking_image.
      '</a>';
  }
}
