;(function() {
"use strict";

const socket = io(),
    app = angular.module('codementormatch-app', ['ui.router', 'ngAnimate', 'ngSanitize', 'ngMaterial', 'ngMessages']),
    resetApp = angular.module('reset-app', []);

const defaultPic = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHEAAACNCAIAAAAPTALlAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAEnQAABJ0Ad5mH3gAAANsSURBVHhe7dVRduIwEETR7GkWmK1HhMch9giw1dWyZNf9mZwM2F3vJ1//TM1N9dxUz0313FTPTfVGb/r9Fh8azIhNCbYTXx7AWE3JE8CDDjVEU3pI8egjHN+UBgl4QXdHNmV6Ml7W0WFNWdwFr+zlgKYM7Y7X5+vdlH0H4YhkXZuy7FCckqlfUzYNgIPSdGrKmmFwVo6LNi24LEGPpowYDMclSG/KgiFxotqlmxZcKZXblMMHxqFSiU25enicq+OmN1wsktWUYyfB0SJuesPRIilNuXQqnK7gpuB0BX1TbpwQA8Lc9IkBYW66wIYYcVNOmxYzYtx0gRkxbrrAjBhlU+6aHGMC3HSNMQFuusaYADddY0yAm64xJsBNK9jTStaUc06BSa3ctIJJrdy0gkmt3LSCSa3ctIJJrdy0gkmt3LSCSa3ctIJJrdy0gkmt3LSCSa3ctIJJrWRNCy6aH3tauekaYwLcdI0xAW66xpgAN11jTICbrjEmQNm04K5pMSPGTReYEeOmC8yIcdMFZsSImxZcNyEGhLnpEwPC9E0LbpwKpyu4KThdIaVpwaWT4GgRN73haBE3veFokaymBfcOj3N1EpsWXD0wDpVyU73cpgW3D4kT1dKbFiwYDMcl6NG0YMdIuCzBRZtyVo5OTQvWDICD0vRrWrDpUJySqWvTgmUH4YhkvZsW7OuO1+e7SlPe3cXl/kZxTaZOTRk0Bm5Kk96UHePhvgS5TTl/YBwqldWUk2fAxTopTTl2HtwtIm7KjXNiQ5iyKafNjCUxsqYcNT/2BGiacs5ZsKqVoCmHnAvbmkSbcsIZsXC/UFNefl7s3Km9Ka89O9bu0diUF14DmzdracqrroTl27jpJizfZndTXnI97N9gX1Mef1VU+GRHUx58bbR4y033ocVbW5vySNuQdVNTHmYPdHnBTVvQ5YXPTXmMLVGnxk0bUafmQ1MeYDU0+s+7pnzVXqPUkpuGUGrpZVO+ZJ/Q6w83jaLXH24qQLKHelM+a9tQ7cFNBaj2UGnKB20P2v1yUw3a/Vo35SO2HwXdVIiCbipEwVVT/tNa3TO6qdI9o5sq3TO6qVjJ+GzK7yymlHRTsVLSTcVKSZryC1NwUz031XNTPTfVuzXlRxNxUz031XNTPTfVc1M9N9VzU70v/jWV7+8ffZYE08zo+Y8AAAAASUVORK5CYII=';

Array.prototype.findUser = function (u) {
    for (var i = 0; i < this.length; i++) {
        if (this[i].user == u) {
            return i;
        }
    }
    return -1;
};
let hadDirect = false;
const dcRedirect = ['$location', '$q', '$injector', function ($location, $q, $injector, $http) {
    //if we get a 401 response, redirect to login
    let currLoc = '';
    return {
        request: function (config) {
            // $log.debug('STATE', $injector.get('$state'));
            currLoc = $location.path();
            return config;
        },
        requestError: function (rejection) {
            return $q.reject(rejection);
        },
        response: function (result) {
            return result;
        },
        responseError: function (response) {
            $log.debug('Something bad happened!', response, currLoc, $location.path());
            hadDirect = true;
            bulmabox.alert(`App Restarting`, `Hi! I've made some sort of change just now to make this app more awesome! Unfortunately, this also means I've needed to restart it. I'm gonna log you out now.`, function (r) {
                fetch('/user/logout')
                    .then(r => {
                        hadDirect = false;
                        $state.go('appSimp.login', {}, {
                            reload: true
                        });
                        return $q.reject(response);
                    });
            });
        }
    };
}];
app
    .constant('IsDevelopment', window.location.hostname === 'localhost')
    .config(['$stateProvider', '$urlRouterProvider', '$locationProvider', '$httpProvider', '$compileProvider', '$logProvider','IsDevelopment','$mdGestureProvider', function ($stateProvider, $urlRouterProvider, $locationProvider, $httpProvider, $compileProvider, $logProvider, IsDevelopment,$mdGestureProvider) {
        $locationProvider.html5Mode(true);
        $urlRouterProvider.otherwise('/404');
        $mdGestureProvider.skipClickHijack();
        $compileProvider.debugInfoEnabled(IsDevelopment);
        $logProvider.debugEnabled(IsDevelopment);
        if(IsDevelopment) console.log('-------------------------\nDebug mode enabled \n-------------------------');
        $stateProvider
            //the states
            //NORMAL states (auth'd)
            .state('app', {
                abstract: true,
                templateUrl: 'layouts/full.html'
            })
            .state('app.dash', {
                url: '/', //default route, if not 404
                templateUrl: 'components/dash.html'
            })
            .state('app.mentor', {
                url: '/mentor',
                templateUrl: 'components/mentor.html'
            })
            .state('app.mod', {
                url: '/mod',
                templateUrl: 'components/mod.html'
            })
            .state('app.help', {
                url: '/help',
                templateUrl: 'components/help/help.html'
            })
            .state('app.match', {
                url: '/match',
                templateUrl: 'components/match.html'
            })
            .state('app.mail', {
                url: '/mail',
                templateUrl: 'components/mail.html'
            })
            .state('app.vote', {
                url: '/vote',
                templateUrl: 'components/voting.html'
            })
            //SIMPLE (unauth'd: login, register, forgot, 404, 500,reset)
            .state('appSimp', {
                abstract: true,
                templateUrl: 'components/layout/simp.html'
            })
            .state('appSimp.login', {
                url: '/login',
                templateUrl: 'components/login.html'
            })
            .state('appSimp.register', {
                url: '/register',
                templateUrl: 'components/register.html'
            })
            //and finally, the error-handling routes!
            .state('appSimp.notfound', {
                url: '/404',
                templateUrl: 'components/alt/404.html'
            })
            .state('appSimp.err', {
                url: '/500',
                templateUrl: 'components/alt/500.html'
            });

        //provider stuff

        $httpProvider.interceptors.push(function ($q) {
            return {
                // optional method
                'request': function (config) {
                    // do something on success
                    return config;
                },

                // optional method
                'requestError': function (rejection) {
                    return $q.reject(rejection);
                },



                // optional method
                'response': function (response, $http) {
                    // do something on success
                    // $log.debug('RESPONSE INTERCEPTOR', response && response.data)
                    if (response && response.data && response.data == 'refresh') {
                        // console.log('need to refresh',socket,socket.to)
                        socket.emit('requestRefresh',{id:socket.id})
                    }
                    return response;
                },

                // optional method
                'responseError': function (rejection) {
                    // do something on error
                    return $q.reject(rejection);
                }
            };
        });
    }])
    .directive("changeReFocus", [function () {
        return {
            restrict: 'EA',
            scope: {
                changeFn: "&"
            },
            link: function (scope, element, attributes) {
                // const theFn = scope.changeFn();
                // $log.debug('THE FUNCTION IS',scope.changeFn())
                element.bind("change", function (changeEvent) {
                    // $log.debug('SCOPE',scope,'ELEMENT',element,'ATTRIBS',attributes,scope.changeFn)
                    scope.changeFn().then(r => {
                        element[0].focus();
                    });
                    // scope.theFn('HELLOTHERE');
                });
            }
            // controller:function($scope, $element, $attrs,){
            //     $log.debug('SCOPE',$scope,'EL',$element)
            // }
        };
    }])
    //the following are for file uploading and markdown conversion. I don't THINK we'll need em, but... eh
    .directive("fileread", ['$log',function ($log) {
        return {
            scope: {
                fileread: "="
            },
            link: function (scope, element, attributes) {
                element.bind("change", function (changeEvent) {
                    const reader = new FileReader(),
                        theFile = changeEvent.target.files[0],
                        tempName = theFile.name;
                    $log.debug('UPLOADING FILE', theFile);
                    reader.onload = function (loadEvent) {
                        let theURI = loadEvent.target.result;
                        $log.debug('URI before optional resize', theURI, theURI.length);
                        if (scope.$parent.needsResize) {
                            //needs to resize img (usually for avatar)
                            resizeDataUrl(scope, theURI, scope.$parent.needsResize, scope.$parent.needsResize, tempName);
                        } else {
                            $log.debug('APPLYING file to $parent', scope.$parent);
                            scope.$apply(function () {
                                if (scope.$parent && scope.$parent.$parent && scope.$parent.$parent.avas) {

                                    scope.$parent.$parent.loadingFile = false;
                                    scope.$parent.$parent.fileName = 'Loaded:' + tempName;
                                    scope.$parent.$parent.fileread = theURI;
                                } else {
                                    scope.$parent.loadingFile = false;
                                    scope.$parent.fileName = 'Loaded:' + tempName;
                                    scope.$parent.fileread = theURI;
                                }
                                if (scope.$parent.saveDataURI && typeof scope.$parent.saveDataURI == 'function') {
                                    scope.$parent.saveDataURI(dataURI);
                                }
                            });
                        }
                    };
                    if (!theFile) {
                        scope.$apply(function () {
                            scope.fileread = '';
                            scope.$parent.fileName = false;
                            scope.$parent.loadingFile = false;
                        });
                        return false;
                    }
                    if (theFile.size > 2500000) {
                        bulmabox.alert('File too Large', `Your file ${theFile.name} is larger than 2.5MB. Please upload a smaller file!`);
                        return false;
                    }
                    reader.readAsDataURL(theFile);
                });
            }
        };
    }])
    .directive("waitForData", [function () {
        return {
            restrict: 'A',
            // scope: {
            //     props: "="
            // },
            link: function (scope, element, attributes) {
                scope.wfdArr = attributes.waitForData.split(',').map(q => q.trim());
                const bgWait = document.createElement('div');
                bgWait.id = 'bg-wait';
                bgWait.innerHTML = 'Loading <div class="loady-spin"></div>';
                document.querySelector('body').append(bgWait);
                document.querySelector('#full-win').style.filter = "blur(9px)";
                let waiters = scope.wfdArr.map(function (q) {
                    // $log.debug('SCOPE HERE IS',scope)
                    const wfdIObj = {
                        fn: null,
                        name: q,
                        data: null
                    };
                    wfdIObj.fn = scope.$watch(q, function (nv, ov) {
                        wfdIObj.data = nv;
                        if (waiters.filter(a => !!a.data).length >= scope.wfdArr.length) {
                            waiters = [];//clear waiters so we're not polluting the scope;
                            document.querySelector('body').removeChild(document.querySelector('#bg-wait'));
                            document.querySelector('#full-win').style.filter = "none";
                        }
                    });
                    return wfdIObj;
                });
            }
        };
    }]);
    // .directive("simpleAutoSuggest", function ($sce) {
    //     return {
    //         restrict: "E",
    //         transclude: true,
    //         replace:true,
    //         scope: {
    //             items: '=simpleAutoItems',
    //             filterFn: '=simpleAutoFilter',
    //             output: '=simpleAutoOutput',
    //             adtnlClasses: '@simpleAutoClasses',
    //             adtnlStyles: '@simpleAutoStyles',
    //             nfText: '@simpleAutoNotFoundText',
    //             subItem: '@simpleAutoSubItem',
    //             verbose: '@simpleAutoVerbose'
    //         },
    //         template: `<div class='sas-cont {{adtnlClasses}}' style='{{adtnlStyles}}'>
    //         <input class='input sas-inp' type='text' ng-model='filterSearch' ng-keyup='doFilter()' />
    //         <div style='width:{{inpBoxDims.width}}px; min-height:100px;' ng-show='hasFocus && ((filteredItems && filteredItems.length)||showNFBox)' id='sas-suggestion-container'>
    //             <div ng-repeat='si in filteredItems' class='simple-auto-suggest-suggestion' ng-click='pickItem(si,$event);$event.stopPropagation();' ng-bind-html='hilite(si,subItem)'></div>
    //             <div ng-show='showNFBox'>
    //                 <ng-transclude>
    //                 </ng-transclude>
    //             </div>
    //         </div>
    //     </div>`,
    //         link: function (scope, element, attributes) {
    //             const vc = function () {
    //                 if (!scope.verbose) {
    //                     return false;
    //                 }
    //                 return console.log(...arguments);
    //             };
    //             vc("ATTRIBUTES", attributes, "ELEMENT", element, 'SCOPE', scope, 'ELEMENT HTML', element.html());
    //             scope.hasFocus = true;
    //             const inpBox = element[0].querySelector(".sas-inp");
    //             setTimeout(function () {
    //                 scope.inpBoxDims = element[0]
    //                     .querySelector(".sas-inp")
    //                     .getBoundingClientRect();
    //             }, 1);
    //             scope.notFoundEvald = () => {
    //                 return $sce.trustAsHtml(scope.nfText)
    //             }
    //             scope.showNFBox = false;
    //             scope.doFilter = () => {
    //                 console.log('SEARCHING FOR',scope.filterSearch, scope.filterFn,scope.filterOkay,scope.items)
    //                 const filterOkay =
    //                     scope.filterFn &&
    //                     typeof scope.filterFn === "function" &&
    //                     scope.items &&
    //                     (scope.items instanceof Array);
    //                 scope.filteredItems =
    //                     (scope.filterSearch &&
    //                         scope.filterSearch.length &&
    //                         filterOkay &&
    //                         scope.filterFn(scope.items, scope.filterSearch,scope.subItem||null)) ||
    //                     null;
    //                 vc(
    //                     "FILTERED STOOF", scope.filteredItems,
    //                     "SEARCH TERM",
    //                     scope.filterSearch,
    //                     'ALL ITEMS',
    //                     scope.items,
    //                     'Filter okay?', filterOkay
    //                 );
    //                 scope.showNFBox =
    //                     !!scope.filterSearch &&
    //                     (!scope.filteredItems || !scope.filteredItems.length);
    //                 // scope.$digest();
    //             }
    //             scope.pickItem = (it, me) => {
    //                 if (scope.output && scope.output !== 'null') {
    //                     //three different possibilities. First, if we're given a function, run dat function. Second, if it's an array, push into array. Thirdly, if neither, just replace
    //                     if (typeof scope.output === 'function') {
    //                         vc('output is fn!')
    //                         scope.output(it);
    //                     } else if (scope.output instanceof Array) {
    //                         vc('output is array')
    //                         scope.output.push(it);
    //                     } else {
    //                         scope.output = it;
    //                     }
    //                     vc('ITEM', it, me)
    //                     scope.filterSearch = it && me && me.srcElement && me.srcElement.innerText;
    //                 } else {
    //                     scope.filterSearch = it;
    //                 }
    //                 if(scope.subItem && scope.filterSearch[scope.subItem]){
    //                     scope.filterSearch = it[scope.subItem]
    //                 }
    //                 scope.filteredItems = [];
    //                 vc('PARENT NOW', scope.$parent, scope.output)
    //             };
    //             const climbAndSearchTree = (el, sel) => {
    //                 currEl = el,
    //                     elPath = [el],
    //                     selectorType = sel && sel[0] == '.' ? 'className' : sel && sel[0] == '#' ? 'id' : null;
    //                 let foundItem = false,
    //                     atTop = false;
    //                 if (sel && !selectorType) {
    //                     throw new Error('climbAndSearchTree only accepts simple className or id selectors for now!');
    //                 }
    //                 while (currEl && !foundItem && !atTop) {
    //                     currEl = currEl.parentNode;
    //                     console.log(currEl.tagName)
    //                     atTop = currEl && currEl.tagName && currEl.tagName.toLowerCase() === 'html';
    //                     elPath.push(currEl);
    //                     if ((selectorType == 'className' && currEl.className && currEl.className.toLowerCase().includes(sel.toLowerCase().slice(1)))
    //                         ||
    //                         (selectorType == 'id' && currEl.id && currEl.id.toLowerCase() == sel.toLowerCase().slice(1))) {
    //                         console.log('FOUND IT!')
    //                         //found the item;
    //                         foundItem = true;
    //                         break;
    //                     }
    //                 }
    //                 return foundItem || (!sel && elPath) || false;
    //             }
    //             vc('THIS SAS IS', element[0].querySelector('.sas-cont'))
    //             scope.hilite = t => {
    //                 const termString = scope.subItem && t[scope.subItem] ? t[scope.subItem] : typeof t !== 'string' ? JSON.stringify(t) : t,
    //                     pos = termString.indexOf(scope.filterSearch);
    //                 return $sce.trustAsHtml(
    //                     `${termString.slice(0, pos)}<strong>${scope.filterSearch}</strong>${termString.slice(
    //                         scope.filterSearch.length + pos
    //                     )}`
    //                 );
    //             };
    //             element[0].querySelector('.sas-inp').addEventListener(
    //                 "focus",
    //                 function (e) {
    //                     // vc('focus event', e,this)
    //                     scope.filterSearch = null;
    //                     scope.hasFocus = true;
    //                     scope.$digest();
    //                 },
    //                 false
    //             );
    //             element[0].querySelector('.sas-inp').addEventListener(
    //                 "blur",
    //                 function (e) {
    //                     setTimeout(function () {
    //                         vc('event', e, 'new Focus', document.elementFromPoint(scope.x, scope.y), climbAndSearchTree(document.elementFromPoint(scope.x, scope.y), '#sas-suggestion-container'))
    //                         if (!climbAndSearchTree(document.elementFromPoint(scope.x, scope.y), '#sas-suggestion-container')) {
    //                             // scope.hasFocus = false;
    //                             scope.hasFocus = false;
    //                             scope.$digest();
    //                         } else {
    //                             console.log('Clicked autosuggest item!')
    //                         }
    //                     }, 5);
    //                 },
    //                 false
    //             );
    //             element[0].addEventListener('mousemove', function simpMouse(e) {
    //                 // vc('MOUSE POS (client)',e.clientX,e.clientY)
    //                 scope.x = e.clientX;
    //                 scope.y = e.clientY;
    //             })
    //         }
    //     };
    // });

String.prototype.titleCase = function () {
    return this.split(/\s/).map(t => t.slice(0, 1).toUpperCase() + t.slice(1).toLowerCase()).join(' ');
};

const resizeDataUrl = (scope, datas, wantedWidth, wantedHeight, tempName) => {
    // We create an image to receive the Data URI
    const img = document.createElement('img');

    // When the event "onload" is triggered we can resize the image.
    img.onload = function () {
        // We create a canvas and get its context.
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // We set the dimensions at the wanted size.
        canvas.width = wantedWidth;
        canvas.height = wantedHeight;

        // We resize the image with the canvas method drawImage();
        ctx.drawImage(this, 0, 0, wantedWidth, wantedHeight);

        const dataURI = canvas.toDataURL();
        scope.$apply(function () {
            scope.$parent.loadingFile = false;
            scope.$parent.fileName = 'Loaded:' + tempName;
            scope.fileread = dataURI;
            if (scope.$parent.saveDataURI && typeof scope.$parent.saveDataURI == 'function') {
                //only for avatar
                scope.$parent.saveDataURI(dataURI);
            }
        });
    };

    // We put the Data URI in the image's src attribute
    img.src = datas;
};

app.directive('postrenderAction', postrenderAction);

/* @ngInject */
function postrenderAction($timeout) {
    // ### Directive Interface
    // Defines base properties for the directive.
    const directive = {
        restrict: 'A',
        priority: 101,
        link: link
    };
    return directive;

    // ### Link Function
    // Provides functionality for the directive during the DOM building/data binding stage.
    function link(scope, element, attrs) {
        $timeout(function () {
            scope.$evalAsync(attrs.postrenderAction);
        }, 0);
    }
}
app.controller('dash-cont', ($scope, $http, $q, userFact, $log) => {
    // $log.debug("Dashboard ctrl registered")
    $scope.refUsr = $scope.$parent.refUsr;

    $scope.refUsr();
    $scope.updateTopics = () => {
        // $log.debug('Would updoot topics here! Val we passed was',e)
        $http.put('/user/interests', $scope.$parent.user.interests)
        .then(r=>{
            // $scope.$parent.$refUsr();
        });
    };
    $scope.removeSkill = skt => {
        // $log.debug('USER WISHES TO REMOVE',skt)
        $http.delete('/user/interests?t=' + skt).then(r => {
            // $scope.$parent.$refUsr();
        });
    };
    $scope.debounceTimer = null;
    $scope.saveDebounce = (q) => {
        if (!!$scope.debounceTimer) {
            clearTimeout($scope.debounceTimer);
        }
        $scope.debounceTimer = setTimeout(function () {
            $scope.saveGeneral();
        }, 500);
    };
    $scope.saveGeneral = () => {
        //general save thing for pretty much everything BUT topics
        const dispName = $scope.user.displayName;
        $http.put('/user/profile', $scope.user).catch(r => {
            //do nuffin
            if (r.data == 'dupDisplay') {
                bulmabox.alert('Duplicate Name', `Sorry, but the name ${dispName} is already in use. Please use another name.`);
                // $scope.$parent.refUsr();
            }
        });
    };
    //avy stuff
    $scope.loadFile = (o) => {
        $log.debug('loadFile sez', o);
        $scope.loadingFile = true;
        const fr = new FileReader();
    };
    $scope.loadingFile = false;
    $scope.fileName = null;
    $scope.topicToAdd = '';
    $scope.needsResize = 200;//the max pic width
    $scope.saveDataURI = (d) => {
        // $log.debug('trying to update datauri to',d)
        $scope.user.avatar = d;
        $scope.saveGeneral();
    };

    $scope.filterMe = (query) => {
        const lowercaseQuery = query.toLowerCase();
        // $log.debug('picked topics map', $scope.pickedTopics.map(q => q.value))
        if (!$scope.topicObjs) {
            return [];
        }
        let tops = $scope.topicObjs.filter(topic => {
            return (topic.value.indexOf(lowercaseQuery) > -1);
        });
        // $log.debug('tops', tops)
        return tops;
    };
    $scope.hazTopic = t => {
        // does this topic already exist?
        return $scope.topicObjsAll && $scope.topicObjsAll.length && t && $scope.topicObjsAll.find(q => q.display == t);
    };
    $scope.newTopic = {
        title: null,
        desc: null,
        show: false
    };
    $scope.refTopObjs = (cb) => {
        $http.get('/topic/topic',{headers:{'Cache-Control': 'no-cache'}}).then(r => {
            $scope.topicObjsAll = r.data.map(q => {
                return { value: q.title.toLowerCase(), display: q.title, desc: q.desc };
            });
            $log.debug('All Topic Objs now:', $scope.topicObjsAll);
            $scope.topicObjs = angular.copy($scope.topicObjsAll);
            if (cb) {
                cb();
            }
        });
    };
    $scope.refTopObjs();
    $scope.toggleNewTopicDia = () => {
        if (!$scope.newTopic.show) {
            $scope.newTopic.title = $scope.topicToAdd;
            const menuShow = document.querySelector('.md-menu-showing'),
                mdVirt = document.querySelector('md-virtual-repeat-container');
            if (menuShow) {
                menuShow.classList.remove('md-menu-showing');
            }
            if (mdVirt) {
                mdVirt.classList.add('ng-hide');
            }

        }
        $scope.newTopic.show = !$scope.newTopic.show;
    };
    $scope.addNewTopic = () => {
        $http.post('/topic/topic', $scope.newTopic)
            .then(r => {
                //do nothing. We refresh in the socket response, just so EVERYONE can no we added a topic.
                socket.emit();
                $scope.toggleNewTopicDia();
            })
            .catch(e => {
                if (e.data == 'duplicate') {
                    bulmabox.alert('Duplicate Topic', `Hey! That topic already exists!`);
                }
            });
    };
    //add skill
    $scope.addInt = {
        title: null,
        show: false,
        lvl: 0,
        newDesc: null,
        canTeach: false,
    };
    $scope.addIntDial = (t) => {
        $scope.addInt = {
            title: t || null,
            show: true,
            lvl: 0,
            newDesc: null,
            canTeach: false,
        };
    };
    socket.on('topicRef',function(o){
        bulmabox.confirm('Topic Refresh',`One or more topics have been update. Would you like to refresh the page to make these new topics available?`,r=>{
            if(!!r){
                return $scope.refTopObjs();
            }
        });
    });
    let alreadyAdded = false;
    $scope.saveSkills = () => {
        if (!$scope.topicToAdd) {
            return bulmabox.alert('No Skill Name', `Please enter a skill name!`);
        }
        const skList = $scope.$parent.user.interests;
        // $log.debug($scope.selectedTopic,$scope.topicToAdd);
        if (!!skList.find(q => q.title == $scope.topicToAdd)) {
            $scope.topicToAdd = '';
            return bulmabox.alert('Duplicate Skill', "You've already added that skill!");
        } else if (!$scope.hazTopic($scope.topicToAdd)) {
            // return $log.debug('USER TRYIN TO ADD NEW TOPIC LIKE A PLEB',$scope.topicToAdd,$scope.addInt.newDesc)
            alreadyAdded = true;
            $http.post('/topic/topic', { title: $scope.topicToAdd, desc: $scope.addInt.newDesc }).then(r => {
                $scope.refTopObjs($scope.saveSkills);
            });
        } else {
            skList.push({
                title: $scope.topicToAdd,
                lvl: $scope.addInt.lvl,
                canTeach: !!$scope.addInt.canTeach
            });
            $scope.topicToAdd = '';
            $http.put('/user/interests', skList)
                .then(r => {
                    $scope.addInt = {
                        title: null,
                        show: false,
                        lvl: 0,
                        canTeach: false,
                    };
                    // $scope.$parent.$refUsr();
                });
        }
    };
    //add/edit proj
    $scope.modProj = {
        show: false,
        proj: null,
        editMode: false
    };
    $scope.modProjDial = (oldP) => {
        if (!oldP) {
            oldP = { name: null, description: null, position: null };
            // $scope.$parent.user.projects.push(oldP)
            $scope.modProj.editMode = false;
        } else {
            $scope.modProj.editMode = true;
        }
        $scope.modProj.proj = oldP;
        $scope.modProj.show = true;
    };
    $scope.saveProjs = (t) => {
        const projArr = angular.copy($scope.$parent.user.projects);
        $log.debug('Saving projects. List is', projArr, 'modProj', $scope.modProj);
        if (!$scope.modProj.editMode) {
            projArr.push(angular.copy($scope.modProj.proj));
        }
        const dupName = countDups(projArr, 'name');
        if (!!dupName) {
            return bulmabox.alert('Duplicate Project Name', `The name ${dupName} is already being used! Please pick another one for this project.`);
        }
        $http.put('/user/projs', projArr)
            .then(r => {
                $scope.modProj = {
                    show: false,
                    proj: null,
                    editMode: false
                };
                // $scope.$parent.$refUsr();
            });
    };
    $scope.projView = {
        proj:null,
        show:false
    };
    $scope.viewEditProj = p =>{
        $scope.projView.proj=p;
        $scope.show=true;
    };
    $scope.deleteProj = t => {
        bulmabox.confirm('Remove Project', `Are you sure you wish to remove the project ${t}?`, r => {
            if (!!r) {
                $http.delete('/user/projs', {data:{ name: t },headers:{'Content-Type': 'application/json;charset=utf-8'}})
                    .then(r => {
                        // $scope.$parent.$refUsr();
                    });
            }
        });
    };
    //curr lesson stuffs
    $scope.countDups = countDups;
    $scope.messageTeacher = l => {
        bulmabox.confirm('Message Mentor', "Do you wish to send a message to this mentor that you wish to discuss the lesson?", function (r) {
            if (!r || r == null) {
                return false;
            }
            $http.post('/user/reqDiscussLesson?id=', l)
                .then(r => {
                    bulmabox.alert('Message Sent', `Your mentor has been notified that you wish to discuss this lesson.`);
                    // $scope.$parent.$refUsr();
                });
        });
    };
    $scope.reqEndLesson = l => {
        bulmabox.confirm('Request Lesson End', "Do you wish to notify this mentor that you wish to end the lesson?", function (r) {
            if (!r || r == null) {
                return false;
            }
            $http.post('/user/reqEndLesson?id=', l)
                .then(r => {
                    bulmabox.alert('Lesson End Requested', `Your mentor has been notified that you wish to end this lesson. <br>Please note that it is still up to them to end the lesson.`);
                    // $scope.$parent.$refUsr();
                });
        });
    };
    $scope.reportLesson = l => {
        bulmabox.confirm('Report Lesson', "Are you sure you wish to report this lesson to the moderator team? <br>Please note that abuse of the report feature in any context is grounds for account termination.", function (r) {
            if (!r || r == null) {
                return false;
            }
            $http.post('/usr/repLesson', l).then(r => {
                bulmabox.alert('Lesson Reported', `This lesson has been reported to the moderator team. In addition, the lesson has automatically been stopped, and a message has been sent to the lesson's mentor.`);
                // $scope.$parent.$refUsr();
            });
        });
    };


    $scope.getLessons = () => {
        $http.get('/user/activeLessons')
            .then(r => {
                $log.debug('ACTIVE LESSONS', r);
                $scope.activeLessons = (r && r.data) || [];
            });
    };
    $scope.getLessons();

    //review stuffs
    $scope.writeReview = async function (tch) {
        //get the review first to see if it exists.
        //note that while we could just default search by user, i wanna give people the option to hide their real usernames (i.e., search by display name)
        $scope.reviewPage.msg = '';
        $scope.reviewPage.stars = 5;
        $scope.reviewPage.currStars = 5;
        $scope.reviewPage.teacher = {
            user: tch.user,
            displayName: tch.displayName || null
        };
        $scope.reviewPage.hideName = false;

        const oldReview = await $http.get(`/user/review?tch=${(tch.displayName || tch.user)}`);
        $log.debug('OLD REVIEW', oldReview);
        if (oldReview) {
            //old review exists, so use it
            $scope.reviewPage.msg = oldReview.data.rateText;
            $scope.reviewPage.stars = oldReview.data.rateNum;
            $scope.reviewPage.currStars = oldReview.data.rateNum;
            $scope.reviewPage.hideName = oldReview.data.hideName;
        }
        $scope.reviewPage.starsArr = [0, 1, 2, 3, 4];
        $scope.reviewPage.show = true;
        $scope.$apply();
    };
    $scope.overStars = false;
    $scope.toggleOverStars = (t, s) => {
        if (t === false) {
            $scope.overStars = false;
            return false;
        }
        $scope.overStars = s;
    };
    $scope.isActiveStar = (i, s, e) => {
        if (!$scope.overStars && $scope.overStars === false) {
            //not currently mousing over
            return i < $scope.reviewPage.stars;
        }
        return $scope.overStars !== false && $scope.overStars + 1 > i;
    };
    $scope.reviewPage = {
        show: false,
        stars: 5,
        currStars: 5,
        teacher: {
            user: 'Nothere',
            displayName: 'DoesntExist'
        },
        msg: null
    };
    $scope.submitReview = () => {
        const rvwObj = {
            // rateUsr: {
            //     user: $scope.$parent.user.user,
            //     displayName: $scope.$parent.user.displayName
            // },
            rateNum: $scope.reviewPage.stars,
            hideName: !!$scope.reviewPage.hideName,
            rateText: $scope.reviewPage.msg,
            tch: {
                user: $scope.reviewPage.teacher.user,
                displayName: $scope.reviewPage.teacher.displayName
            }
        };
        $log.debug('WOULD SUBMIT', rvwObj);
        $http.put('/user/review', rvwObj).then(r => {
            $scope.reviewPage = {
                show: false,
                stars: 5,
                currStars: 5,
                teacher: {
                    user: 'Nothere',
                    displayName: 'DoesntExist'
                },
                msg: null
            };
            // $scope.$parent.$refUsr();
        });
    };
});
const countDups = (arr, p) => {
    if (!arr || !arr.length) {
        return false;
    }
    const nameCount = {};
    for (let i = 0; i < arr.length; i++) {
        if (!nameCount[arr[i][p]]) {
            nameCount[arr[i][p]] = 1;
        } else {
            return nameCount[arr[i][p]];
        }
    }
    return false;
};
app.controller('log-cont', function ($scope, $http, $state, $q, userFact, $log) {
    $scope.noWarn = false;
    $scope.nameOkay = true;
    delete localStorage.geoUsr;
    $scope.acceptNoSecure = () => {
        localStorage.CMMNoSecure = true;
        $scope.cmmNoSecure = true;
    }
    $scope.cmmNoSecure = !!localStorage.CMMNoSecure;
    $scope.checkTimer = false;
    $scope.goReg = () => {
        $state.go('appSimp.register');
    };
    $scope.goLog = () => {
        $state.go('appSimp.login');
    };
    $scope.googLog = () => {
        window.location.href = './user/google';
    };
    $scope.forgot = () => {
        if (!$scope.user) {
            bulmabox.alert('<i class="fa fa-exclamation-triangle is-size-3"></i>&nbsp;Forgot Password', 'To recieve a password reset email, please enter your username!');
            return;
        }
        userFact.forgot({ user: $scope.user }).then(function (r) {
            $log.debug('forgot route response', r);
            if (r.data == 'err') {
                bulmabox.alert('<i class="fa fa-exclamation-triangle is-size-3"></i>&nbsp;Forgot Password Error', "It looks like that account either doesn't exist, or doesn't have an email registered with it! Contact a mod for further help.");
            } else {
                bulmabox.alert('Forgot Password', 'Check your email! If your username is registered, you should recieve an email from us with a password reset link.');
            }
        });
    };
    $scope.signin = () => {
        $log.debug('trying to login with', $scope.user, $scope.pwd);
        userFact.login({ user: $scope.user, pass: $scope.pwd })
            .then((r) => {
                $log.debug(r);
                if (r.data == 'authErr' || !r.data) {
                    bulmabox.alert('<i class="fa fa-exclamation-triangle is-size-3"></i>&nbsp;Incorrect Login', 'Either your username or password (or both!) are incorrect.');
                } else if (r.data == 'banned') {
                    bulmabox.alert('<i class="fa fa-exclamation-triangle is-size-3"></i>&nbsp;Banned', "You've been banned!");
                } else {
                    // delete r.data.msgs;
                    $log.debug('LOGIN RESPONSE', r.data);
                    socket.emit('chatMsg', { msg: `${$scope.user} logged in!` });
                    localStorage.geoUsr = JSON.stringify(r.data.usr);
                    if (r.data.news) {
                        bulmabox.alert('Updates/News', `Since you last logged in, the following updates have been implemented:<br><ul style='list-style:disc;'><li>${r.data.news.join('</li><li>')}</li></ul>`);
                    }
                    $state.go('app.dash');
                }
            })
            .catch(e => {
                if (e.data.status == 'banned') {
                    return bulmabox.alert('<i class="fa fa-exclamation-triangle is-size-3"></i>&nbsp;Banned', `You've been banned by moderator ${e.data.usr}!`);
                }
                bulmabox.alert('<i class="fa fa-exclamation-triangle is-size-3"></i>&nbsp;Error', "There's been some sort of error logging in. This is <i>probably</i> not an issue with your credentials. Blame the devs!");
                $log.debug(e);
            });
    };
    $scope.checkUser = () => {
        if ($scope.checkTimer) {
            clearTimeout($scope.checkTimer);
        }
        $scope.checkTimer = setTimeout(function () {
            userFact.nameCheck($scope.user)
                .then((r) => {
                    $scope.nameOkay = r.data;
                });
        }, 500);
    };
    $scope.emailBad = false;
    // const emailRegex = new RegExp("[A-Za-z0-9]{3}@",'g')
    $scope.checkEmail = () => {
        // console.log('document active el',document.activeElement)
        // console.log('comparing',$scope.regForm.email.$viewValue,'onlyIfInv',onlyIfInv,'emailBad curr val',$scope.emailBad)
        // if(!$scope.emailBad){
        $scope.emailBad = $scope.regForm.email && $scope.regForm.email.$viewValue.length && !$scope.regForm.email.$valid;
        // }
        // else if(!$scope.regForm.email.$viewValue || $scope.regForm.email.$viewValue.length){
        //     $scope.emailBad=false;
        // }
        // $scope.emailBad = $scope.email && $scope.email.length && !$scope.email.search(/([^][()<>@,;:\\". \x00-\x1F\x7F]+|"(\n|(\\\r)*([^"\\\r\n]|\\[^\r]))*(\\\r)*")(\.([^][()<>@,;:\\". \x00-\x1F\x7F]+|"(\n|(\\\r)*([^"\\\r\n]|\\[^\r]))*(\\\r)*"))*@([^][()<>@,;:\\". \x00-\x1F\x7F]+|\[(\n|(\\\r)*([^][\\\r\n]|\\[^\r]))*(\\\r)*])(\.([^][()<>@,;:\\". \x00-\x1F\x7F]+|\[(\n|(\\\r)*([^][\\\r\n]|\\[^\r]))*(\\\r)*]))*/g);
    };
    $scope.pwdNoDup = false;
    $scope.checkPwdDup = () => {
        $scope.pwdNoDup = !$scope.pwd || !$scope.pwdDup || $scope.pwdDup !== $scope.pwd;
    }
    $scope.pwdStrStars = [0,1,2,3,4,];
    $scope.badPwds = ['password','pass','1234','123','admin','abc','abcd','pwd'];
    $scope.pwdStr = {recs:[],score:0,maxScore:5,show:false}
    $scope.checkPwdStr = () => {
        
        if(!$scope.pwd){
            return false;
        }
        const reqs = [{
            desc: 'Using at least one uppercase letter',
            reg: '[A-Z]'
        }, {
            desc: 'Using at least one lowercase letter',
            reg: '[a-z]'
        }, {
            desc: 'Using at least one number',
            reg: '[0-9]'
        }, {
            desc: 'Using at least one "special" character (@, !, $, etc.)',
            reg: '[@!\$\^_\*&]'
        },{
            desc:'Using at least 12 characters',
            reg:'[\\w]{12}'
        },{
            desc:'Not using a bad password',
            negate:true,
            reg:['password','pass','1234','123','admin','abc','abcd','pwd'].map(q=>`(${q})`).join('|')
        }],
            badStuff = reqs.filter(re => { //stuff we're MISSINg
                const reg = new RegExp(re.reg);
                if(re.negate){
                    return !!reg.test($scope.pwd);
                }
                return !reg.test($scope.pwd);
            });
        $scope.pwdStr = {recs:badStuff,score:reqs.length-badStuff.length,maxScore:5,show:$scope.pwdStr.show}
    }
    $scope.register = () => {
        if (!$scope.pwd || !$scope.pwdDup || !$scope.user) {
            bulmabox.alert('<i class="fa fa-exclamation-triangle is-size-3"></i>&nbsp;Missing Information', 'Please enter a username, and a password (twice).');
        } else if ($scope.pwd != $scope.pwdDup) {
            $log.debug('derp');
            bulmabox.alert('<i class="fa fa-exclamation-triangle is-size-3"></i>&nbsp;Password Mismatch', 'Your passwords don\'t match, or are missing!');
        } else if (!$scope.email || $scope.emailBad) {
            bulmabox.confirm('<i class="fa fa-exclamation-triangle is-size-3"></i>&nbsp;Send Without Email?', `You've either not included an email, or the format you're using doesn't seem to match any we know. <br>While you <i>can</i> register without a valid email, it'll be much more difficult to recover your account if you forget your password!<br>Register anyway?`, function (resp) {
                if (!resp || resp == null) {
                    return false;
                }
                userFact.newUser({
                    user: $scope.user,
                    pass: $scope.pwd,
                    email: $scope.email
                })
                    .then((r) => {
                        userFact.login({ user: $scope.user, pass: $scope.pwd })
                            .then(() => {
                                $state.go('app.dash');
                            }).catch(e => {
                                if (e.data == 'duplicate') {
                                    bulmabox.alert('<i class="fa fa-exclamation-triangle is-size-3"></i>&nbsp;User Already Exists', "That account already exists. Are you sure you didn't mean to log in?");
                                }
                            });
                    }).catch(e => {
                        if (e.data == 'duplicate') {
                            bulmabox.alert('<i class="fa fa-exclamation-triangle is-size-3"></i>&nbsp;User Already Exists', "That account already exists. Are you sure you didn't mean to log in?");
                        }
                    });
            });
        } else {
            $log.debug('running register with user', $scope.user, 'and pwd', $scope.pwd);
            userFact.newUser({
                user: $scope.user,
                pass: $scope.pwd,
                email: $scope.email
            })
                .then((r) => {
                    userFact.login({ user: $scope.user, pass: $scope.pwd })
                        .then(() => {
                            $state.go('app.dash');
                        });
                }).catch(e => {
                    if (e.data == 'duplicate') {
                        bulmabox.alert('<i class="fa fa-exclamation-triangle is-size-3"></i>&nbsp;User Already Exists', "That account already exists. Are you sure you didn't mean to log in?");
                    }
                });
        }
    };
});
app.controller('mail-cont', ($scope, $http, $q, $log, userFact) => {
    $log.debug("Mailbox ctrl registered");
    $scope.outMode = false;
    $scope.mailView = {
        title: 'No Message Selected',
        htmlMsg: 'Not sure how you got here, but there is not message here!',
        mdMsg: '',
        show: false,
        toMode: false,
        date: 12345,
        other: false
    };
    $scope.viewMsg = d => {
        $log.debug('incoming msg object is', d);
        $scope.mailView.title = d.to ? `Message to ${$scope.getUserList(d.to)}` : `Message from ${d.from.displayName || d.from.user}`;
        $scope.mailView.htmlMsg = d.htmlMsg;
        $scope.mailView.isConMsg = !!d.isConMsg;
        $scope.mailView.date = d.date;
        $scope.mailView.toMode = !!d.to;
        $scope.mailView.other = d.to || d.from;
        $scope.mailView.topics = d.topics;
        $scope.mailView._id = d._id;
        $scope.mailView.msgId = d.msgId || 0;
        $scope.mailView.show = true;
        $scope.mailView.isRep = !!d.isRep;
    };
    $scope.newMsg = {
        to: [],
        htmlMsg: '',
        isReply: false,
        show: false,
    };
    $scope.reportMsg = m => {
        bulmabox.confirm('Report Message', `Are you sure you wish to report this message from ${m.other} to the moderator team?`, a => {
            if (a && a != null) {
                $http.post('/user/repMsg', m)
                    .then(r => {
                        bulmabox.alert('Reported!', 'A notification has been sent to the moderator team!');
                    });
            }
        });
    };
    $scope.startTeach = () => {
        $http.put('/user/teach', $scope.mailView).then(r => {
            //do nuffin
            $scope.mailView.show = false;
        });
    };
    $scope.explStartTeach = () => {
        bulmabox.alert('Start Teaching', `Clicking the "Teach" button will allow the student to leave reviews for you. <br>While there's nothing explicitly preventing you from connecting on your own, we'd still recommend you click this button, as well-written reviews are always helpful!`);
    };
    $scope.replyMsg = m => {
        $log.debug('attempting to setup reply to msg', m);
        $scope.newMsg.show = true;
        $scope.newMsg.to = [m.from || m.other];
        $scope.newMsg.isReply = m;
        //we also reset Mailview so that we don't have two dialogs open.
        $scope.mailView = {
            title: 'No Message Selected',
            htmlMsg: '',
            mdMsg: '',
            rawMsg: '',
            show: false,
            toMode: false,
            date: 12345,
            other: false
        };
        $log.debug('newMsg now', $scope.newMsg);
    };
    $scope.cancelSend = () => {
        if ($scope.newMsg.mdMsg && $scope.newMsg.mdMsg.length) {
            bulmabox.confirm('Discard Message', 'Are you sure you wish to discard this message?', ra => {
                if (ra && ra != null) {
                    $scope.newMsg = {
                        to: [],
                        htmlMsg: '',
                        isReply: false,
                        show: false
                    };
                    $scope.$digest();
                }
            });
        } else {
            $scope.newMsg = {
                to: [],
                htmlMsg: '',
                isReply: false,
                show: false,
            };
        }
    };
    $scope.makeNewMsg = () => {
        //new, blank msg
        $scope.newMsg.show = true;
        $scope.newMsg.to = [];
        $scope.newMsg.isReply = false;
    };
    $scope.sendMsg = () => {
        if (!$scope.newMsg.to.length || !$scope.newMsg.mdMsg || !$scope.newMsg.mdMsg.length) {
            return bulmabox.alert('Missing Information', 'Please provide at least one user and something to say!');
        }
        const conv = new showdown.Converter();
        $scope.newMsg.htmlMsg = conv.makeHtml($scope.newMsg.mdMsg);
        if (!!$scope.newMsg.isReply) {
            //concatenate the old and new msgs.
            $scope.newMsg.htmlMsg = `${$scope.newMsg.isReply.htmlMsg}<hr>${$scope.newMsg.htmlMsg}`;
            $scope.newMsg.mdMsg = `${$scope.newMsg.isReply.mdMsg}\n---\n${$scope.newMsg.mdMsg}`;
        }
        // return $log.debug('WOULD SEND:', $scope.newMsg)
        userFact.sendMsg({
            to: $scope.newMsg.to,
            htmlMsg: $scope.newMsg.htmlMsg,
            mdMsg: $scope.newMsg.mdMsg
        }).then(r => {
            $scope.newMsg = {
                to: [],
                htmlMsg: '',
                isReply: false,
                show: false,
            };
            bulmabox.alert('Message Sent!', 'Your message is on its way!');
        });
    };
    $scope.newMsgAdd = e => {
        if (!$scope.newMsg.show) {
            return false;
        }
        // $log.debug('EVENT:',e);
        if (e.key.toLowerCase() === 'enter' && !$scope.newMsg.to.includes($scope.newMsg.possUsr)) {
            $scope.newMsg.to.push($scope.newMsg.possUsr);
            $scope.newMsg.possUsr = '';
        } else if (e.key.toLowerCase() === 'enter') {
            // $log.debug('ALREADY HAZ', thisTag)
            const timerFn = function () {
                let tl = 250;
                const thisTag = document.querySelector(`.user-to-tag[data-name='${$scope.newMsg.possUsr}']`),
                    intv = setInterval(function () {
                        //for lightness: 50% to 96%
                        tl -= 10;
                        if (tl < 0) {
                            return clearInterval(intv);
                        }
                        const lite = ~~(46 * ((250 - tl) / 250)),
                            col = `hsl(0,${~~(100 * tl / 250)}%,${lite + 50}%)`;
                        thisTag.style.background = col;
                    }, 10);
            }();
            $scope.newMsg.possUsr = '';
        }
    };
    $scope.newMsgRem = u => {
        if (!$scope.newMsg.show) {
            return false;
        }
        $scope.newMsg.to = $scope.newMsg.to.filter(q => q != u);
    };
    $scope.delMsg = m => {
        bulmabox.confirm('Delete Message', `Are you sure you wish to delete this message? This is <i>not</i> reversable!`, a => {
            if (a && a != null) {
                const uri = m.from ? `/user/delMsg?msgId=${m.msgId}` : `/user/delMyMsg?msgId=${m.msgId}`;
                $http.get(uri)
                    .then(r => {
                        //do nothing; should refresh.
                    });
            }
        });
    };
    $scope.getUserList = (o) => {
        return o.map(q => q.displayName || q.user).join(', ');
    };
});
String.prototype.capMe = function () {
    return this.slice(0, 1).toUpperCase() + this.slice(1);
}; 
app.controller('main-cont', function ($scope, $http, $state, userFact, $log) {
    $log.debug('main controller registered!');
    $scope.user = null;
    $scope.refUsr = ()=>{
        userFact.getUser().then(r => {
            $scope.user = r.data;            
            // $scope.$apply();
        }); 
    };
    socket.on('refreshById',u=>{
        userFact.getUser().then(r => {
            $scope.user = r.data;            
            $scope.$apply();
        }); 
    });
    $scope.refUsr();
    socket.on('refresh',u=>{
        if($scope.user && u.user==$scope.user.user){
            $scope.refUsr();
        }
    });
    $scope.isActive=true;
    $scope.pokeTimer = null;
    $scope.faceOpen = false;
    const baseTitle = 'CodeMentorMatch';
    window.addEventListener('focus',function(e){
        $scope.isActive = true;
        if($scope.pokeTimer){
            clearInterval($scope.pokeTimer);
        }
        document.title = baseTitle;
    });
    window.addEventListener('blur',function(e){
        $scope.isActive = false;
    });
    const faces = ['😐','😮',];
    socket.on('chatMsgOut',(m)=>{
        //for detecting if someone has mentioned us in chat and w
        if(m.msg.includes('@'+$scope.user.user) && m.user!=$scope.user.user && !$scope.isActive){
            // $log.debug('this user was mentioned in',m)
            $scope.pokeTimer = setInterval(function(){
                $scope.faceOpen = !$scope.faceOpen;
                let pos = $scope.faceOpen?0:1;
                document.title=faces[pos]+' '+ baseTitle;
            },250);
        }
        // $log.debug('MESSAGE',m)
    });
    //used to see if this user is still online after a disconnect.
    //also used to see who ELSE is online
    socket.on('reqHeartBeat', function (sr) {
        $scope.alsoOnline = sr.filter(q => !$scope.user || !$scope.user.user || $scope.user.user != q.name).map(m => m.name);
        // $log.debug('Users that are not this user online',$scope.alsoOnline)
        // $log.debug('$state is',$state)
        if ($scope.user && $scope.user.user && $state.current.name.includes('app.')) {
            socket.emit('hbResp', {
                name: $scope.user.user
            });
        }
    });
    socket.on('disco',m=>{
        if(!m.on){
            $scope.col='div:nth-child(even){animation:none;}div:nth-child(odd){animation:none}';
        }else{
            $scope.col='div:nth-child(even){animation:huehue 4s linear 2s infinite;}div:nth-child(odd){animation:huehue 4s linear 0s infinite;}';
        }
        $scope.$apply();
    });
    // socket.on('allNames',function(r){
    // 	$scope.online = r;
    // 	$log.debug('users now online are',r)
    // })
    $scope.explMd = () => {
        bulmabox.alert('Markdown', `<div class='is-size-2'>Markdown</div>
        <hr>
        <div class='is-size-5'>What It Is</div>
        <p>Markdown is a specialized way of formatting text, used by sites like Reddit, Stack Overflow, and apps like Discord.</p>
        <hr>
        <div class='is-size-5'>What It Does</div>
        <p>It allows you to format text with stuff like <strong>bold</strong> or <em>italics</em> without the use of fancy, complex word processors.</p>
        <hr>
        <div class='is-size-4'>Commands:</div>
        <table class="table table-striped table-bordered">
        <thead>
        <tr>
        <th style="text-align:left"><strong>Markdown</strong></th>
        <th style="text-align:left"><strong>Result</strong></th>
        </tr>
        </thead>
        <tbody>
        <tr>
        <td style="text-align:left">#text, ##text,…</td>
        <td style="text-align:left">header (big text). More '#'s means smaller headers</td>
        </tr>
        <tr>
        <td style="text-align:left">*text*, _text_</td>
        <td style="text-align:left"><em>italic text</em></td>
        </tr>
        <tr>
        <td style="text-align:left">**text**,__text,__</td>
        <td style="text-align:left"><strong>bold text</strong></td>
        </tr>
        <tr>
        <td style="text-align:left">~~text~~</td>
        <td style="text-align:left"><s>strikethrough text</s> woops!</td>
        </tr>
        <tr>
        <td style="text-align:left">[link text](link url)</td>
        <td style="text-align:left"><a href="https://www.google.com">links</a></td>
        </tr>
        <tr>
        <td style="text-align:left">- item</td>
        <td style="text-align:left">- item in a bullet list</td>
        </tr>
        <tr>
        <td style="text-align:left">1. item</td>
        <td style="text-align:left">1. Item in a numbered list</td>
        </tr>
        <tr>
        <td style="text-align:left">![alt text](url “hover text”)</td>
        <td style="text-align:left"><img src="https://github.com/adam-p/markdown-here/raw/master/src/common/images/icon48.png" alt="alt text" title="hover text"> (The alt text is displayed if the browser can’t load the image)</td>
        </tr>
        <tr>
        <td style="text-align:left">\`text\`</td>
        <td style="text-align:left"><code>look ma, ima programmer!</code></td>
        </tr>
        </tbody>
        </table>`);
    };
    $scope.sc = '';
    $scope.seekrit = {
        code: ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a', 'Space'],
        on: false,
        asking: false,
        hist: [],
        corrNum: 0,
        whichFont: 0
    };
    $scope.fontOpts = ['aurebesh', 'tengwar quenya-1', 'klingon font', 'hieroglyphic', 'dovahkiin', 'Skyrim_Daedra'];
    const bgImg = `./img/bgs/bg${Math.ceil(Math.random()*3)}.jpg`
    $scope.bgFull = `background:linear-gradient(rgba(0,0,0,.4),rgba(0,0,0,.4)),url('${bgImg}'); background-size:cover; background-attachment:fixed; will-change:transform; background-repeat:no-repeat`
    document.addEventListener('scroll',function(q){
        // console.log('The User Scrolls V: border-color:skyblue;',q,window.scrollY)
        setTimeout(function(){
            const sFd = 0.5 + (0.45*window.scrollY/window.outerHeight);
            $scope.bgFull = `background:linear-gradient(rgba(0,0,0,${sFd}),rgba(0,0,0,${sFd})),url('${bgImg}'); background-size:cover; background-attachment:fixed;will-change:transform; background-repeat:no-repeat`
            $scope.$apply();
        },100)
    })
    document.querySelector('body').addEventListener('keyup', function (e) {
        e.preventDefault();
        // $log.debug('KEY PRESSED WAS', e)
        if ($scope.seekrit.asking) {
            //asking kweschun, so ignore keypress
            return false;
        }
        const nextCode = $scope.seekrit.code[$scope.seekrit.corrNum]; //the next correct code to be entered
        if ((e.key.toLowerCase() != nextCode && e.code != nextCode)) {
            //wrong code: return false and do nuffink
            // $scope.seekrit.on=false;
            // $scope.sc = '';
            // $scope.seekrit.corrNum=0;
            return false;
        } else if ($scope.seekrit.corrNum + 1 === $scope.seekrit.code.length) {
            //at end
            $scope.seekrit.asking = true;
            bulmabox.confirm('Toggle Secret Mode', 'Are you sure you wanna toggle the Secret Mode?', function (r) {
                if (r && r !== null) {
                    $scope.seekrit.on = !$scope.seekrit.on;
                    if (!!$scope.seekrit.on) {
                        let theFont = $scope.fontOpts[$scope.seekrit.whichFont];
                        $scope.seekrit.whichFont++;
                        if ($scope.seekrit.whichFont >= $scope.fontOpts.length) {
                            $scope.seekrit.whichFont = 0;
                        }
                        $scope.sc = `*:not(.fa){font-family:${theFont},arial!important;}`;
                    } else {
                        $scope.sc = '';
                    }
                    $scope.$digest();
                } else {
                    $scope.sc = '';
                    $scope.$digest();
                }
                $scope.seekrit.asking = false;
                $scope.seekrit.corrNum = 0;
            });
        } else {
            $scope.seekrit.corrNum++;
        }
    });
}).filter('numToDate', function () {
    return function (num) {
        if (isNaN(num)) {
            return 'Invalid date!';
        }
        const theDate = new Date(num);
        // $log.debug(theDate.getMinutes())
        return `${theDate.toLocaleDateString()} ${theDate.getHours() % 12}:${theDate.getMinutes().toString().length < 2 ? '0' + theDate.getMinutes() : theDate.getMinutes()} ${theDate.getHours() < 13 ? 'AM' : 'PM'}`;
    };
});

app.controller('match-cont', function ($scope, $http, $q, $log) {
    $log.debug("matcher ctrl registered");
    // $scope.searchTerm = '';
    // $scope.topics = [];
    // $scope.searchTimer = null;
    // $scope.doSearch = ()=>{
    //     if(!!$scope.searchTimer){
    //         clearTimeout($scope.searchTimer);
    //     }
    //     $scope.searchTimer = setTimeout(function(){
    //         // $log.debug('Searching for:',$scope.searchTerm,'http module is',$http)
    //         $http.get('/topic/search?q='+$scope.searchTerm)
    //             .then(r=>{
    //                 $scope.topics = r.data;
    //             })
    //             .catch(e=>{
    //                 $log.debug(e)
    //             })
    //     },500)
    // }
    // $scope.topicToAdd = '';
    // $scope.selectedItem = null;
    $scope.regetTopics = () => {
        $http.get('/topic/topic').then(r => {
            $scope.topicObjsAll = r.data.map(q => {
                return { value: q.title.toLowerCase(), display: q.title, desc: q.desc };
            });
            $scope.topicObjs = angular.copy($scope.topicObjsAll);
            $scope.topicObjs.push({ value: 'addSkill', display: '---- + Add a skill ----', desc: 'Add a new skill!' });
        });
    };
    socket.on('topicRef', function (o) {
        bulmabox.confirm('Topic Refresh', `One or more topics have been update. Would you like to refresh the page to make these new topics available?`, r => {
            if (!!r) {
                return window.location.reload(true);
            }
        });
    });
    $scope.regetTopics();
    // $scope.filterMe = (query) => {
    //     const lowercaseQuery = query.toLowerCase();
    //     // $log.debug('picked topics map', $scope.pickedTopics.map(q => q.value))
    //     let tops = $scope.topicObjs.filter(topic => {
    //         return (topic.value.indexOf(lowercaseQuery) > -1);
    //     });
    //     // $log.debug('tops', tops)
    //     return tops;
    // };
    // $scope.SASFilter =  (a, f, s) => {
    //     if (!f) {
    //         return (a && a.length && a) || [];
    //     }
    //     console.log('filtering items',a,'with',f)
    //     return a.filter(q => {
    //         // console.log('FILTER ITEM',q)
    //         const searchableItem = s?q[s]:q;
    //         return searchableItem.toLowerCase().includes(f.toLowerCase())
    //     });
    // }
    $scope.clearSearch = ()=>{
        $scope.skillSearch='';
        $scope.showNSR = false;
        $scope.$digest();
    }
    $scope.showNSR = false;
    // $scope.nsr = document.querySelector('#no_result')
    new autoComplete({
        data: {                              // Data src [Array, Function, Async] | (REQUIRED)
            src: async () => {
                const query = $scope.skillSearch;
                const freshData = await fetch('/topic/topic'),
                data = await freshData.json();
                // const data = await $http.get('/topic/topic');
                // Return Fetched data
                console.log('data',data);
                return data;
            },
            key: ["title"],
            cache: false
        },
        sort: (a, b) => {                    // Sort rendered results ascendingly | (Optional)
            return a.match-b.match
        },
        placeHolder: "Pick a skill",     // Place Holder text                 | (Optional)
        selector: "#autoComplete",           // Input field selector              | (Optional)
        threshold: 0,                        // Min. Chars length to start Engine | (Optional)
        debounce: 0,                       // Post duration for engine to start | (Optional)
        searchEngine: "strict",              // Search Engine type/mode           | (Optional)
        highlight: true,                       // Highlight matching results      | (Optional)
        // maxResults: 5,                         // Max. number of rendered results | (Optional)
        resultsList: {                       // Rendered results list object      | (Optional)
            render: true,
            container: source => {
                source.setAttribute("id", "skill-list");
            },
            destination: document.querySelector("#autoComplete"),
            position: "afterend",
            element: "ul"
        },
        resultItem: {                          // Rendered result item            | (Optional)
            content: (data, source) => {
                console.log('in resultItem',data,source)
                source.innerHTML = data.match;
            },
            element: "li"
        },
        noResults: () => {                     // Action script on noResults      | (Optional)
            // const result = $scope.nsr;
            // result.style.display = 'block';
            // result.setAttribute("tabindex", "1");
            // result.innerHTML = "No Results";
            // document.querySelector("#skill-list").appendChild(result);
            console.log('TRIGGERED NSR CALLBACK',$scope.skillSearch,$scope.showNSR)
            $scope.showNSR = true;
            console.log('SHOWNSR NOW',$scope.showNSR)
            $scope.$apply();
        },
        onSelection: feedback => {             // Action script onSelection event | (Optional)
            //actual item is: feedback.selection.value;
            $scope.selectedTopic = feedback.selection.value;
            $scope.$digest();
            document.querySelector("#autoComplete").value='';
        }
    });
    $scope.pickedItem = null;
    $scope.newTopic = {
        title: null,
        desc: null,
        show: false
    };
    $scope.toggleNewTopicDia = () => {
        document.dispatchEvent(new Event('click'));
        $scope.newTopic.title = !$scope.newTopic.show ? $scope.topicToAdd : null;
        const nfCtrl = document.querySelector('.md-standard-list-container.md-autocomplete-suggestions-container');
        if (!$scope.newTopic.show) {
            nfCtrl.className += ' ng-hide';
        } else {
            // nfCtrl.className = nfCtrl.className.replace(' ng-hide','')
        }
        $scope.newTopic.show = !$scope.newTopic.show;
        if (!$scope.newTopic.show && waitingForTopic) {
            waitingForTopic = false;
            $scope.regetTopics();
        }
    };
    let waitingForTopic = false;
    socket.on('topicUpdate', u => {
        if (!!$scope.newTopic.show) {
            //if the topic adding window is currently showing, don't refresh; wait for user to submit new topic;
            waitingForTopic = true;
        } else {
            $scope.regetTopics();
        }
    });
    $scope.AddNewSkill = (e)=>{
        e.preventDefault();
        console.log('user wants to add skill called ',$scope.skillSearch)
        $scope.clearSearch();
    }
    $scope.addNewTopic = () => {
        $http.post('/topic/topic', $scope.newTopic)
            .then(r => {
                //do nothing. We refresh in the socket response, just so EVERYONE can no we added a topic.
                $scope.toggleNewTopicDia();
            })
            .catch(e => {
                if (e.data == 'duplicate') {
                    bulmabox.alert('Duplicate Topic', `Hey! That topic already exists!`);
                }
            });
    };
    $scope.pickedTopics = [];
    $scope.addTopicBtn = () => {
        // // $log.debug( $scope.pickedTopics.length,$scope.topicObjs.length)
        // const simpPT = $scope.pickedTopics.map(a => a.value).sort().join(''),
        //     simpTO = $scope.topicObjs ? $scope.topicObjs.filter(q => q.value !== 'addSkill').map(b => b.value).sort().join('') : '';
        // $log.debug("simple data", simpPT, simpTO)
        // if (!simpTO || !simpTO.length) {
        //     return `You've added all possible skills! Create a new one if you want`;
        // } else if ($scope.selectedTopic && !simpPT.includes($scope.selectedTopic.value)) {
        //     return 'Click to add your selected skill!';
        // } else {
        //     return `You need to select a skill before you can add it!`;
        // }
        return 'Nothing to see here!'
    };
    $scope.changeTopList = () => {
        // $log.debug('simpTops', tl, 'all', $scope.topicObjsAll)
        const tl = $scope.pickedTopics.map(s => s.value.toLowerCase());
        //remove this from our list of available topics to add
        $scope.topicObjs = $scope.topicObjsAll.filter(tf => !tl.includes(tf.value));
        $http.post('/user/topicSearch', $scope.pickedTopics).then(r => {
            $scope.availTeachs = r.data;
            // $log.debug('TEACHERS',$scope.availTeachs)
        });
    };
    $scope.addSearchTopic = (q) => {
        $log.debug('topic', q);
        if ($scope.pickedTopics.map(a => a.value.toLowerCase()).includes(q.value)) {
            // $log.debug('Duplicate!',q)
            $scope.topicToAdd = '';
            return bulmabox.alert(`Already Added`, `You've already added this topic!`);
        }
        const topicPush = angular.copy(q);
        topicPush.min = 1;
        $scope.pickedTopics.push(topicPush);
        $scope.changeTopList();
        // $scope.filterMe('')
        // $scope.topicObjs = $scope.topicObjsAll.filter(q => !.includes(q));
        $scope.topicToAdd = '';
    };
    $scope.removeTopic = t => {
        $scope.pickedTopics = $scope.pickedTopics.filter(q => q.value != t.value);
        $scope.changeTopList();
    };
    $scope.mentCon = {
        topics: [],
        user: null,
        show: false,
        tz: { from: null, to: null, offset: new Date().getTimezoneOffset() },
        plusMdMsg: null,
        plusHtmlMsg: null,
    };
    $scope.times = new Array(24).fill(1).map((q, i) => {
        let tl = null;
        if (i < 12) {
            tl = (i + 1) + ':00 AM';
        } else {
            tl = (i - 11) + ':00 PM';
        }
        return {
            label: tl,
            num: i
        };
    });
    // $scope.lvls = ['None', 2, 3, 4, 5, 6, 7, 8, 9, 10];
    $scope.lvls = new Array(10).fill(1).map((q, i) => ({ lbl: i > 1 ? i : 'None', num: i }));
    $scope.conv = new showdown.Converter();
    $scope.doConnect = u => {
        //set up the dialog box for connecting w/ mentor
        $scope.mentCon.user = u.user;
        $scope.mentCon.displayName = u.displayName || null;
        $scope.mentCon.topics = $scope.pickedTopics.map(s => s.value);
        $scope.mentCon.plusMdMsg = null;
        $scope.mentCon.plusHtmlMsg = null;
        $scope.mentCon.tz = { from: null, to: null };
        $scope.mentCon.show = true;
        $scope.mentCon.topics = $scope.pickedTopics.map(q => q.display);
        // $log.debug('original incoming object to doConnect was',u)
        // $scope.$apply();
    };
    $scope.sendConnectMsg = t => {
        // $log.debug('would send', $scope.mentCon)
        $scope.mentCon.plusHtmlMsg = $scope.conv.makeHtml($scope.mentCon.plusMdMsg);
        // return false;
        $http.put('/user/connect', $scope.mentCon).then(r => {
            $scope.mentCon.show = false;
            bulmabox.alert('Connect Request Sent', `User ${$scope.mentCon.displayName || $scope.mentCon.user} has been notified that you'd like them as a mentor!`);
        });
    };
    //lesson request stuff
    $scope.reqLess = () => {
        $log.debug('User', $scope.$parent.user, 'wants lesosn on topics', $scope.pickedTopics);
        //now we need to prepare an object to send to our lessonReq model
        const lro = $scope.pickedTopics.map(q => q.display);
        $log.debug('Final LRO:', lro);
        $http.post('/user/lessonReq', lro).then(r => {
            bulmabox.alert('Lesson Request Sent', `Your lesson request has been sent! You can head on over to the "View Requested Lessons" tab if you wanna view or delete it.`);
        }).catch(e => {
            bulmabox.alert("Duplicate Lesson Request", `You've already requested a lesson for these skills!`);
        });
    };
    $scope.answerRl = (rl) => {
        const topicList = rl.topics.map(q => {
            const topicOnTeacher = $scope.$parent.user.interests.find(a => a.title == q.title);
            if (!topicOnTeacher) {
                //teacher does not have this topic
                return `<li>${q.title}  <div class='tag is-warning' title='This skill is not in your list of personally known skills!'><div class='fa fa-exclamation-triangle'></div></div></li>`;
            } else if (topicOnTeacher.lvl <= q.lvl) {
                //teacher's experience is equal to or less than student's
                return `<li>${q.title}  <div class='tag is-danger' title='Your level in this skill is less than or equal to the student's level!'><div class='fa fa-exclamation-triangle'></div></div></li>`;
            } else {
                return `<li>${q.title}</li>`;
            }
        }).join('');
        bulmabox.confirm('Teach Lesson', `Are you sure you wish to teach a lesson on the following topics?
        <ul class="contents">
        ${topicList}
        </ul>`, r => {
            if (!!r && r != null) {
                $http.post('/user/teachLessonReq', {
                    id: rl._id
                }).then(r => {
                    bulmabox.alert('Teach Offer Sent', `This student has been notified that you wish to teach this lesson. You'll be notified when they respond to your request.`);
                    $scope.regetReqLsns();
                });
            }
        });
    };
    $scope.noAnswerRl = o => {
        bulmabox.confirm("Cancel Teaching Offer", `Are you sure you wish to rescind your offer to teach these skills to ${o.displayName || o.user}?`, r => {
            if (!!r && r != null) {
                $http.post('/user/teachLessonReq', {
                    id: o._id
                }).then(r => {
                    $scope.regetReqLsns();
                });
            }
        });
    };
    $scope.deleteRl = (o) => {
        $log.debug('WANNA DELETE LESSON', o);
        bulmabox.confirm('Delete Lesson Request', `Are you sure you wish to delete this lesson request?<br/>You'll need to make a new one if you wanna learn these skills!`, r => {
            if (!!r && r != null) {
                $http.delete('/user/lessonReq?id=' + o._id).then(r => {
                    $scope.regetReqLsns();
                });
            }
        });
    };
    $scope.acceptMentor = (tchr, lsn) => {
        bulmabox.confirm('Accept Mentor', `Are you sure you wish to accept this mentor? This will remove the lesson from the list of Requested Lessons and send a message to both of you to connect.`, r => {
            if (!!r && r != null) {
                $http.post('/user/acceptLesson', { id: lsn._id, teacher: tchr }).then(r => {
                    $scope.regetReqLsns();
                });
            }
        });
    };
    $scope.regetReqLsns = () => {
        $http.get('/user/lessonReq').then(r => {
            $scope.requestedLessons = r.data;
        });
    };
    $scope.tchrInfo = {
        teacher: null,
        show: false
    };
    $scope.showTchrInfo = t => {
        // $log.debug("Would show teacher info for ",t)
        $scope.tchrInfo.tchr = t;
        $scope.tchrInfo.show = true;
    };
    $scope.totalStars = [0, 1, 2, 3, 4];
    socket.on('refReqLs', o => {
        $scope.regetReqLsns();
    });
});
app.controller('mentor-cont', ($scope, $http, $q, userFact, $log) => {
    $log.debug("mentor ctrl registered");
    $scope.totalStars = [0, 1, 2, 3, 4];
    $scope.messageUser = l => {
        $log.debug('sending message to', l.user);
        $http.post('/user/LCmsgStudent', l)
            .then(r => {
                bulmabox.alert('Message Sent', 'Your student {{l.user.displayName||l.user.user}} has been notified that you wish to speak with them regarding this lesson.');
            });
    };
    $scope.toggleActive = l => {
        const title = l.active ? "Deactivate Lesson" : "Re-activate Lesson",
            msg = l.active ? `Are you sure you wish to deactivate (end) this lesson?` : `Are you sure you wish to re-activate (resume) this lesson?`;
        bulmabox.confirm(title, msg, r => {
            if (!!r) {
                $http.get('/user/LCtoggleActive?id=' + l._id)
                    .then(r => {
                        //do nuffin
                    });
            }
        });
    };
    $scope.toggleHide = l => {
        const title = l.active ? "Hide Lesson" : "Un-Hide Lesson",
            msg = l.active ? `Are you sure you wish to hide this lesson?<br>Hiding a lesson will prevent it from showing up on your Teacher Review panel.` : `Are you sure you wish to un-hide this lesson? <br>Un-hiding a lesson will make it visible again on your Teacher Review panel.`;
        bulmabox.confirm(title, msg, r => {
            if (!!r) {
                $http.get('/user/LCtoggleHide?id=' + l._id)
                    .then(r => {
                        //do nuffin
                    });
            }
        });
    };
});

app.controller('mod-cont', function ($scope, $http, $state, $log, userFact) {
    setInterval(function () {
        if ((!$scope.$parent || !$scope.$parent.user || !$scope.$parent.user.mod) && $state.current.name == 'app.mod') {
            console.log('User not mod');
            $state.go('app.dash');
        }
    }, 1);
    console.log('current state', $state.current);
    $scope.getAllUsers = () => {
        $http.get('/user/users').then(us => {
            // console.log('ALL USERS IS',us)
            $scope.allUsrs = us && us.data;
        }).catch(e => {
            if (e.data && e.data == 'noUsrs') {
                return bulmabox.alert('No Users!', `Something's gone wrong, and we can't find any users.`);
            }
        });
    };
    $scope.getAllUsers();
    $scope.toggleBan = u => {
        //toggle ban for a user
        if (u.user === $scope.$parent.user.user) {
            return bulmabox.alert(`Cannot Ban Self`, `You can't ban yourself!`);
        }
        const t = u.isBanned ? 'Unban User' : 'Ban User',
            m = u.isBanned ? `Are you sure you wish to unban ${u.displayName || u.user}? This will restore their access to CodeMentorMatch.` : `Are you sure you wish to ban ${u.displayName || u.user}? This will revoke their access to CodeMentorMatch.`;
        bulmabox.alert(t, m, r => {
            if (!!r) {
                $http.put('/user/toggleBan', {
                    user: u.user,
                })
                    .then(r => {
                        $scope.getAllUsers();
                    });
            }
        });
    };
    $scope.showMsgDial = u => {
        $scope.newMsg = {
            user: u.user,
            displayName: u.displayName,
            msg: null,
            show: true
        };
    };
    $scope.cancelMsg = () => {
        $scope.newMsg = {
            user: null,
            displayName: null,
            msg: null,
            show: false
        };
    };
    $scope.newMsg = {
        user: null,
        displayName: null,
        mdMsg: null,
        show: false
    };
    $scope.sendMsg = () => {
        if (!$scope.newMsg.mdMsg || $scope.newMsg.mdMsg.trim().length) {
            return bulmabox.alert('No Message', `Please enter a message to send!`);
        }
        const conv = new showdown.Converter();
        $scope.newMsg.htmlMsg = conv.makeHtml($scope.newMsg.mdMsg);
        userFact.sendMsg($scope.newMsg)
            .then(r => {
                bulmabox.alert('Message Sent!', `Your message is on its way!`);
            });
    };
});
app.controller('nav-cont',function($scope,$http,$state, $log, userFact){
    $scope.currState = 'dash';
	$scope.logout = function() {
        bulmabox.confirm('Logout','Are you sure you wish to logout?', function(resp) {
            if (!resp || resp == null) {
                return true;
            } else {
               userFact.logout().then(function(r) {
                    $log.debug('b4 logout usr removl, parent scope is',$scope.$parent.user);
                    $scope.$parent.user=null;
                    $log.debug('and now its',$scope.$parent.user);
                    $state.go('appSimp.login');
                });
            }
        });
    };
    $log.debug('USER ON NAVBAR',$scope.$parent && $scope.$parent.user);
    $scope.navEls = [{
        st:'dash',
        icon:'user-circle',
        protected:false,
        text:'Profile'
    },{
        st:'match',
        icon:'users',
        protected:false,
        text:'Match'
    },{
        st:'mentor',
        icon:'graduation-cap',
        protected:false,
        text:'Mentoring'
    },{
        st:'vote',
        icon:'check-square',
        protected:false,
        text:'Voting'
    },{
        st:'mail',
        icon:'envelope',
        protected:false,
        text:'Mailbox'
    },{
        st:'mod',
        icon:'cogs',
        protected:true,
        text:'Mod Controls'
    },{
        st:'help',
        icon:'question-circle',
        protected:true,
        text:'Help'
    }];
    $scope.goState = s =>{
        $scope.currState = s;
        $state.go('app.'+s);
    };
    $scope.mobActive=false;
});
resetApp.controller('reset-contr',function($scope,$http,$location, $log,userFact){
    $scope.key = window.location.search.slice(5);
    $scope.isRf = window.location.href.includes('rf');
    if(!$scope.key && !$scope.isRf){
        window.location.href='/rf';
    }
    userFact.resetKey($scope.key).then(function(u){
        $log.debug('getting reset user status?',u);
        $scope.user=u.data;
    }).catch(e=>{
        if(e.data=='noUsr' && !$scope.isRf){
            window.location.href='/rf';
        }
    });
    $scope.doReset = function(){
        if(!$scope.user || !$scope.pwd || !$scope.pwdDup || $scope.pwdDup!=$scope.pwd ||!$scope.key){
            bulmabox.alert('Error: Missing data','Make sure you&rsquo;ve reached this page from a password reset link, and that you have entered the same password in both fields!');
        }else{
            userFact.resetPwd({
                acct:$scope.user.user,
                pwd:$scope.pwd,
                pwdDup:$scope.pwdDup,
                key:$scope.key
            }).then(function(r){
                if(r.data=='err'){
                    bulmabox.alert('Error resetting password','There was an error resetting your password. Please contact a mod');
                }else{
                    bulmabox.alert('Password Reset','Your password was successfully reset! We\'re redirecting you to login now.',function(){
                        $scope.goLogin();
                    });
                }
            });
        }
    };
    $scope.goLogin = ()=>{
        window.location.href='../../login';
    };
});
const timezoneList = [
   {
      "value": -12,
      "text": "(GMT -12:00) Eniwetok, Kwajalein"
   },
   {
      "value": -11,
      "text": "(GMT -11:00) Midway Island, Samoa"
   },
   {
      "value": -10,
      "text": "(GMT -10:00) Hawaii"
   },
   {
      "value": -9,
      "text": "(GMT -9:00) Alaska"
   },
   {
      "value": -8,
      "text": "(GMT -8:00) Pacific Time (US & Canada)"
   },
   {
      "value": -7,
      "text": "(GMT -7:00) Mountain Time (US & Canada)"
   },
   {
      "value": -6,
      "text": "(GMT -6:00) Central Time (US & Canada), Mexico City"
   },
   {
      "value": -5,
      "text": "(GMT -5:00) Eastern Time (US & Canada), Bogota, Lima"
   },
   {
      "value": -4,
      "text": "(GMT -4:00) Atlantic Time (Canada), Caracas, La Paz"
   },
   {
      "value": -3.5,
      "text": "(GMT -3:30) Newfoundland"
   },
   {
      "value": -3,
      "text": "(GMT -3:00) Brazil, Buenos Aires, Georgetown"
   },
   {
      "value": -2,
      "text": "(GMT -2:00) Mid-Atlantic"
   },
   {
      "value": -1,
      "text": "(GMT -1:00) Azores, Cape Verde Islands"
   },
   {
      "value": 0,
      "text": "(GMT) Western Europe Time, London, Lisbon, Casablanca"
   },
   {
      "value": 1,
      "text": "(GMT +1:00) Brussels, Copenhagen, Madrid, Paris"
   },
   {
      "value": 2,
      "text": "(GMT +2:00) Kaliningrad, South Africa"
   },
   {
      "value": 3,
      "text": "(GMT +3:00) Baghdad, Riyadh, Moscow, St. Petersburg"
   },
   {
      "value": 3.5,
      "text": "(GMT +3:30) Tehran"
   },
   {
      "value": 4,
      "text": "(GMT +4:00) Abu Dhabi, Muscat, Baku, Tbilisi"
   },
   {
      "value": 4.5,
      "text": "(GMT +4:30) Kabul"
   },
   {
      "value": 5,
      "text": "(GMT +5:00) Ekaterinburg, Islamabad, Karachi, Tashkent"
   },
   {
      "value": 5.5,
      "text": "(GMT +5:30) Bombay, Calcutta, Madras, New Delhi"
   },
   {
      "value": 5.75,
      "text": "(GMT +5:45) Kathmandu"
   },
   {
      "value": 6,
      "text": "(GMT +6:00) Almaty, Dhaka, Colombo"
   },
   {
      "value": 7,
      "text": "(GMT +7:00) Bangkok, Hanoi, Jakarta"
   },
   {
      "value": 8,
      "text": "(GMT +8:00) Beijing, Perth, Singapore, Hong Kong"
   },
   {
      "value": 9,
      "text": "(GMT +9:00) Tokyo, Seoul, Osaka, Sapporo, Yakutsk"
   },
   {
      "value": 9.5,
      "text": "(GMT +9:30) Adelaide, Darwin"
   },
   {
      "value": 10,
      "text": "(GMT +10:00) Eastern Australia, Guam, Vladivostok"
   },
   {
      "value": 11,
      "text": "(GMT +11:00) Magadan, Solomon Islands, New Caledonia"
   },
   {
      "value": 12,
      "text": "(GMT +12:00) Auckland, Wellington, Fiji, Kamchatka"
   }
];
app.controller('vote-cont',function($scope,$http,$state, $log){
    $scope.voteItems = [];
    $scope.regetVotes = ()=>{
        $http.get('/topic/vote').then(r=>{
            console.log('topics for voting are',r);
            $scope.voteItems = (r && r.data)||[];
        });
    };
    $scope.regetVotes();
    
    $scope.submitVote=(m,t)=>{
        //vote up or down on a particular topic
        $http.put('/topic/vote',{id:t._id,mode:m}).then(r=>{
            $scope.regetVotes();
        }); 
    };
    $scope.getScore=v=>{
        return v.votes.votesUp.length-v.votes.votesDown.length;
    };
    socket.on('voteRef',function(o){
        $scope.regetVotes();
    });
});
app.factory('socketFac', function ($rootScope) {
  var socket = io.connect();
  return {
    on: function (eventName, callback) {
      socket.on(eventName, function () { 
        var args = arguments;
        $rootScope.$apply(function () {
          callback.apply(socket, args);
        });
      });
    },
    emit: function (eventName, data, callback) {
      socket.emit(eventName, data, function () {
        var args = arguments;
        $rootScope.$apply(function () {
          if (callback) {
            callback.apply(socket, args);
          }
        });
      });
    }
  };
});
app.run(['$rootScope', '$state', '$stateParams', '$transitions', '$q', 'userFact', '$log', function ($rootScope, $state, $stateParams, $transitions, $q, userFact, $log) {
    $transitions.onBefore({ to: 'app.**' }, function (trans) {
        let def = $q.defer();
        $log.debug('TRANS', trans);
        const usrCheck = trans.injector().get('userFact');
        usrCheck.getUser().then(function (r) {
            $log.debug('response from login chck', r);
            if (r.data) {
                def.resolve(true);
            } else {
                // User isn't authenticated. Redirect to a new Target State
                def.resolve($state.target('appSimp.login', undefined, { location: true }));
            }
        }).catch(e => {
            $log.debug('TRANSITION BLOCKED! Error was',e);
            def.resolve($state.target('appSimp.login', undefined, { location: true }));
        });
        return def.promise;
    });
    $transitions.onFinish({ to: 'app.**' }, function () {
        document.body.scrollTop = document.documentElement.scrollTop = 0;
    });
}]);
app.factory('userFact', function($http,$log) {
    return {
        getUser: function() {
            return $http.get('/user/usrData').then(function(s) {
                $log.debug('getUser in fac says:', s);
                return s;
            });
        },
        newUser:function(o){
            return $http.post('/user/new',o).then(function(r){
                return r;
            })
        },
        login:function(o){
            return $http.put('/user/login',o).then(function(r){
                return r;
            })
        },
        logout:function(){
            return $http.get('/user/logout').then(function(r){
                return r;
            })
        },
        sendMsg:function(o){
            return $http.put('/user/sendMsg',o).then(function(r){
                return r;
            })
        },
        forgot:function(o){
            return $http.put('/user/forgot',o).then(function(r){
                return r;
            })
        },
        resetKey:function(k){
            return $http.get('/user/resetUsr?key='+o).then(function(r){
                return r;
            })
        },
        resetPwd:function(k){
            return $http.put('/user/resetPwd',o).then(function(r){
                return r;
            })
        },
        nameCheck:function(n){
            return $http.get('/user/nameOkay?name='+n).then(function(r){
                return r;
            })
        }
    };
});
}());
