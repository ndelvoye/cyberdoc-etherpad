'use strict';

describe('Select color dropdown localization', function () {
  const changeEtherpadLanguageTo = function (lang, callback) {
    const boldTitles = {
      en: 'Bold (Ctrl+B)',
      fr: 'Gras (Ctrl+B)',
    };
    const chrome$ = helper.padChrome$;

    // click on the settings button to make settings visible
    const $settingsButton = chrome$('.buttonicon-settings');
    $settingsButton.click();

    // select the language
    const $language = chrome$('#languagemenu');
    $language.val(lang);
    $language.change();

    // hide settings again
    $settingsButton.click();

    helper.waitFor(() => chrome$('.buttonicon-bold').parent()[0].title === boldTitles[lang])
        .done(callback);
  };

  // create a new pad with comment before each test run
  beforeEach(function (cb) {
    helper.newPad(() => {
      changeEtherpadLanguageTo('fr', cb);
    });
    this.timeout(60000);
  });

  // ensure we go back to English to avoid breaking other tests:
  after(function (cb) {
    changeEtherpadLanguageTo('en', cb);
  });

  it('Localizes dropdown when Etherpad language is changed', function (done) {
    const optionTranslations = {
      'ep_highlight_color.color': 'Couleurs',
      'ep_highlight_color.black': 'noir',
      'ep_highlight_color.red': 'rouge',
      'ep_highlight_color.green': 'vert',
      'ep_highlight_color.blue': 'bleu',
      'ep_highlight_color.yellow': 'jaune',
      'ep_highlight_color.orange': 'orange',
    };
    const chrome$ = helper.padChrome$;
    const $options = chrome$('#editbar').find('#font-highlight-color').find('option');
    $options.each(function (index) {
      const $key = $(this).attr('data-l10n-id');
      const $text = $(this).text();
      expect($text).to.be(optionTranslations[$key]);

      if (index === ($options.length - 1)) {
        return done();
      }
    });
  });
});
