// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * @package local_o365
 * @author James McQuillan <james.mcquillan@remote-learner.net>
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 * @copyright (C) 2014 onwards Microsoft Open Technologies, Inc. (http://msopentech.com/)
 */

$(function() {


$.fn.azuresetup = function(options) {
    var defaultopts = {
        url: 'localhost',
        iconsuccess: '',
        iconinfo: '',
        iconerror: '',

        strupdate: 'Update',
        strchecking: 'Checking...',
        strmissingperms: 'Missing Permissions:',
        strpermscorrect: 'Permissions correct.',
        strfixperms: 'Fix Permissions',
        strfixprereq: '',
        strerrorfix: 'An error occurred trying to fix permissions.',
        strerrorcheck: 'An error occurred trying to check Azure setup.',
        strnoinfo: 'We don\'t have any information about your Azure setup yet. Please click the Update button to check.',

        showunified: false,
        strunifiedheader: 'Unified API',
        strunifieddesc: 'The unified API replaces the existing application-specific APIs. If available, you should add this to your Azure application.',
        strunifiederror: 'There was an error checking Unified API settings.',
        strunifiedpermerror: 'There was an error checking Unified API permissions.',
        strunifiedmissing: 'The unified API was not found in this application.',
        strunifiedactive: 'Unified API active.',

        strlegacyheader: 'Legacy API',
        strlegacydesc: 'The legacy API is made up of application-specific APIs.',
        strlegacyerror: 'There was an error checking legacy API settings.',
    };
    var opts = $.extend({}, defaultopts, options);
    var main = this;
    this.refreshbutton = this.find('button.refreshperms');

    this.fixperms = function(e) {
        e.preventDefault();
        e.stopPropagation();
        $.ajax({
            url: opts.url,
            type: 'GET',
            data: {mode: 'fixappperms'},
            dataType: 'json',
            success: function(data) {
                if (typeof(data.success) != 'undefined' && data.success === true) {
                    main.find('.statusmessage').html('').hide();
                    main.find('.local_o365_statusmessage')
                            .removeClass('alert-error').addClass('alert-success')
                            .find('img.smallicon').replaceWith(opts.iconsuccess);
                    main.find('.permmessage').html(opts.strpermscorrect);
                } else {
                    main.find('.statusmessage').html('<div>'+opts.strerrorfix+'</div>');
                }
                return true;
            },
            error: function(data) {
                main.setstatus('invalid');
            }
        });
    }

    /**
     * Render an error box.
     *
     * @param string content HTML to use as box body.
     * @return object jQuery object representing rendered box.
     */
    this.rendererrorbox = function(content) {
        var box = $('<div></div>').addClass('alert-error local_o365_statusmessage');
        box.append(opts.iconerror);
        box.append('<span style="inline-block">'+content+'</span>');
        return box;
    }

    /**
     * Render an info box.
     *
     * @param string content HTML to use as box body.
     * @return object jQuery object representing rendered box.
     */
    this.renderinfobox = function(content) {
        var box = $('<div></div>').addClass('alert-info local_o365_statusmessage');
        box.append(opts.iconinfo);
        box.append('<span style="inline-block">'+content+'</span>');
        return box;
    }

    /**
     * Render an success box.
     *
     * @param string content HTML to use as box body.
     * @return object jQuery object representing rendered box.
     */
    this.rendersuccessbox = function(content) {
        var box = $('<div></div>').addClass('alert-success local_o365_statusmessage');
        box.append(opts.iconsuccess);
        box.append('<span style="inline-block">'+content+'</span>');
        return box;
    }

    /**
     * Update tool display.
     *
     * @param string|object content HTML or jQuery object to display.
     */
    this.updatedisplay = function(content) {
        main.find('.results').html(content);
    }

    /**
     * Render unified API setup results.
     *
     * @param object data Data returned from ajax call.
     * @return object jQuery object for rendered results section.
     */
    this.rendersection_unifiedapi = function(data) {
        if (typeof(data.error) !== 'undefined') {
            return main.rendererrorbox(data.error);
        }

        var unifiedactive = (typeof(data.active) !== 'undefined' && data.active === true) ? true : false;
        if (unifiedactive === true) {
            var content = $('<div></div>');
            content.append(main.rendersuccessbox(opts.strunifiedactive));
            if (typeof(data.missingperms) === 'object' && data.missingperms !== null) {
                if (Object.keys(data.missingperms).length > 0) {
                    var missingpermsbox = opts.strmissingperms+'<ul>';
                    for (var perm in data.missingperms) {
                        missingpermsbox += '<li>'+data.missingperms[perm]+'</li>';
                    }
                    missingpermsbox += '</ul>';
                    content.append(main.rendererrorbox(missingpermsbox));
                } else {
                    content.append(main.rendersuccessbox(opts.strpermscorrect));
                }
            } else {
                content.append(main.rendererrorbox(opts.strunifiedpermerror));
            }
            return content;
        } else {
            return main.rendererrorbox(opts.strunifiedmissing);
        }
    }

    /**
     * Render legacy API setup results.
     *
     * @param object data Data returned from ajax call.
     * @return object jQuery object for rendered results section.
     */
    this.rendersection_legacyapi = function(data) {
        if (typeof(data.error) !== 'undefined') {
            return main.rendererrorbox(data.error);
        }

        if (typeof(data.missingperms) !== 'undefined' && Object.keys(data.missingperms).length > 0) {
            // Render missing permissions.
            var content = opts.strmissingperms+'<br />';
            for (var appname in data.missingperms) {
                content += '<b>'+appname+'</b>';
                content += '<ul>';
                for (var permname in data.missingperms[appname]) {
                    content += '<li>'+data.missingperms[appname][permname]+'</li>';
                }
                content += '</ul>';
            }
            var content = main.rendererrorbox(content);

            // Add fix instructions/button.
            if (typeof(data.haswrite) !== 'undefined' && data.haswrite === true) {
                main.fixbutton = $('<button>'+opts.strfixperms+'</button>');
                main.fixbutton.click(main.fixperms);
                content.append(main.fixbutton);
            } else {
                content.append('<span>'+opts.strfixprereq+'</span>');
            }

            return content;
        } else {
            return main.rendersuccessbox(opts.strpermscorrect);
        }
    }

    /**
     * Render all results.
     *
     * @param object results Results object.
     */
    this.renderresults = function(results) {
        var content = $('<div class="adminsetting_azuresetup_results"></div>');
        if (results === false) {
            content.append(main.renderinfobox(opts.strnoinfo));
            main.updatedisplay(content);
            return true;
        }
        if (typeof(results.success) != 'undefined') {
            if (results.success === true && typeof(results.data) != 'undefined') {
                if (opts.showunified === true) {
                    // Unified API.
                    var unified = $('<section></section>');
                    unified.append('<h5>'+opts.strunifiedheader+'</h5>');
                    unified.append('<span>'+opts.strunifieddesc+'</h5>');
                    if (typeof(results.data.unifiedapi) !== 'undefined') {
                        unified.append(main.rendersection_unifiedapi(results.data.unifiedapi));
                    } else {
                        unified.append(main.rendererrorbox(opts.strunifiederror));
                    }
                    content.append(unified);
                }

                // Legacy API.
                var legacy = $('<section></section>');
                legacy.append('<h5>'+opts.strlegacyheader+'</h5>');
                legacy.append('<span>'+opts.strlegacydesc+'</h5>');
                if (typeof(results.data.legacyapi) !== 'undefined') {
                    legacy.append(main.rendersection_legacyapi(results.data.legacyapi));
                } else {
                    legacy.append(main.rendererrorbox(opts.strlegacyerror));
                }
                content.append(legacy);

                main.updatedisplay(content);
                return true;
            }

            if (results.success === false && typeof(results.errormessage) != 'undefined') {
                content.append(main.rendererrorbox(results.errormessage));
                main.updatedisplay(content);
                return true;
            }
        }

        content.append(main.rendererrorbox(opts.strerrorcheck));
        main.updatedisplay(content);
        return true;
    }

    this.checksetup = function() {
        this.refreshbutton.html(opts.strchecking);
        $.ajax({
            url: opts.url,
            type: 'GET',
            data: {mode: 'checksetup'},
            dataType: 'json',
            success: function(resp) {
                main.refreshbutton.html(opts.strupdate);
                main.renderresults(resp);
            },
            error: function(data, errorThrown, textStatus) {
                main.refreshbutton.html(opts.strupdate);
                var content = main.rendererrorbox(opts.strerrorcheck+' ('+textStatus+')');
                main.updatedisplay(content);
            }
        });
    }

    this.init = function() {
        if (typeof(opts.lastresults) !== 'undefined') {
            main.renderresults(opts.lastresults);
        }
        this.refreshbutton.click(function(e) {
            e.preventDefault();
            e.stopPropagation();
            main.checksetup();
        });
    }
    this.init();
}

});