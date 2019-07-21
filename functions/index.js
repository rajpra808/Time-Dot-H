'use strict';
const name = "Time Dot H";
// requirements
const {
  dialogflow,
  BasicCard,
  BrowseCarousel,
  BrowseCarouselItem,
  Button,
  Carousel,
  Image,
  LinkOutSuggestion,
  List,
  MediaObject,
  Suggestions,
  SimpleResponse,
  Table
 } = require('actions-on-google');
const functions = require('firebase-functions');
const fs = require("fs");
const fetch = require('isomorphic-fetch');
const app = dialogflow({
  debug: true
});

const prompts = {
  'welcome': [
    `Welcome to ${name}.`,
  ],
  'welcome_back': [
    `Welcome back to ${name}.`,
    `Hi again. Welcome back to ${name}.`
  ],
  'confirmation': [
    'Sure.',
    'OK.',
    'Okay.',
    'Sure thing.',
    'Alright.'
  ],
  'help': [
    'You can listen Motivational Songs in this app',
    'You can ask for the track to be repeated or you can ask for the next track. What do you want to do now?'
  ],
  'error': [
    'Oops! Something went wrong. Please try again later.'
  ],
  'end': [
    'Hope to see you soon.',
    'Come back soon.',
    'Hope to talk to you again soon.'
  ],
  'NoContests':[
    `There is no Upcomming prescheduled contest Right now. Try on another plateforms`,
    `Currently no contests are prescheduled. Check it again letter `,
    `There is no prescheduled contest . Please check after some time.`
  ],
  'ShowResult':[
    `Here is the list of contest`,
    'Here is the list of coding competitions',
    `Here is the list of contest to participate`,
    `List of contests `

  ]
};

const Image_Url ={
  'codechef.com':'https://s3.amazonaws.com/codechef_shared/sites/all/themes/abessive/logo.png',
  'codeforces.com':'https://sta.codeforces.com/s/34548/images/codeforces-logo-with-telegram.png',
  'facebook.com/hackercup':'https://firebasestorage.googleapis.com/v0/b/timedoth.appspot.com/o/Facebook-Hacker-Cup.jpg?alt=media&token=fa70c1f5-5c66-45bd-bce0-8d41cc27fee9',
  'codingcompetitions.withgoogle.com':'https://firebasestorage.googleapis.com/v0/b/timedoth.appspot.com/o/google.png?alt=media&token=d097147e-7477-4ad2-8e3b-90855cca4818',
  'hackerearth.com':'https://firebasestorage.googleapis.com/v0/b/timedoth.appspot.com/o/hackerearth.png?alt=media&token=d0cc4d75-7327-4f6f-90d5-e5d7a2c8f8ea',
  'hackerrank.com':'https://firebasestorage.googleapis.com/v0/b/timedoth.appspot.com/o/hackerrank_logo.png?alt=media&token=57526793-e7f6-4486-9bbc-fb33488838f4',
  'leetcode.com':'https://firebasestorage.googleapis.com/v0/b/timedoth.appspot.com/o/LeetCode.png?alt=media&token=d8092ad0-083f-4a23-b8fa-c9181c3648c8',
  'spoj.com':'https://firebasestorage.googleapis.com/v0/b/timedoth.appspot.com/o/spoj.png?alt=media&token=8da188fc-f27a-4e83-bf34-c760158fc91b',
  'topcoder.com':'https://firebasestorage.googleapis.com/v0/b/timedoth.appspot.com/o/topcoder.svg?alt=media&token=236ad088-0fc3-43cc-bec0-baa13f786419',
  'uva.onlinejudge.org':'https://firebasestorage.googleapis.com/v0/b/timedoth.appspot.com/o/uva.png?alt=media&token=6cfea324-bb4c-4cde-92ce-40f92400edb2'
};

//get random elements from array
const getRandomItem = (array) => {
  return array[Math.floor(Math.random() * (array.length))];
};
// remaining Time for contest
const remainingTime = (start) => {
  var st = new Date(start);
  var cur = new Date();
  var ms = st-cur;
  var d, h, m, s;
  s = Math.floor(ms / 1000);
  m = Math.floor(s / 60);
  s = s % 60;
  h = Math.floor(m / 60);
  m = m % 60;
  d = Math.floor(h / 24);
  h = h % 24;
  var res = d + 'Days '+h+'Hours '+m+'Minutes '+s+'Seconds';
  return res;
};

//status of the contest running or upcomming
const getStatus = (start,end)=>{
  var st = new Date(start);
  var en = new Date(end);
  var cur = new Date();
  var res='';
  if(cur < en && cur > st)
  {
    res = "**Running**";
  }
  else {
    var rm_time = remainingTime(start);
    res = "start in " + rm_time;
  }
  return res;
}

//IST change to IST
const GetISTtime=(TimeToChange)=>{
  return new Date(TimeToChange).toLocaleString('en-US', {
      timeZone: 'Asia/Calcutta'
  });
}
// Do common tasks for each intent invocation
app.middleware((conv, framework) => {
  conv.voice = conv.input.type === 'VOICE';
  if (!(conv.intent === 'Default Fallback Intent')) {
    conv.data.fallbackCount = 0;
  }
});

//API
var Config_file = fs.readFileSync("config.json");
var Config = JSON.parse(Config_file);
const API_Key = Config.API_Key;
const User_Name=Config.User_Name;

const clist_url = "https://clist.by/api/v1/json/contest/?";
const Today_Date_Time = new Date().toISOString().replace(/\..+/, '.0Z');

//Suggestions
const top_plateforms = new Suggestions('Contests on Codechef','About Time.H','Contests on google','Contests on Hackerearth','Help','Contests on TopCoder',"Contests on Codeforces");

//Welcome intent handling
app.intent('Default Welcome Intent', (conv) => {
  conv.ask(conv.user.last.seen ? getRandomItem(prompts.welcome_back) : getRandomItem(prompts.welcome));
  conv.ask(top_plateforms);
});


app.intent('Spacial Intent', (conv,{pname}) => {
  const upcomming_con_url = clist_url+"resource__name="+pname[0]+"&username="+User_Name+"&api_key="+API_Key+"&end__gt="+Today_Date_Time+"&order_by=start";
  return fetch(upcomming_con_url)
    .then((response) => {
      if (response.status < 200 || response.status >= 300) {
        throw new Error(response.statusText);
      } else {
        return response.json();
      }
    })
    .then((json) => {
      const data = json.objects;
      const contests = [];
      var ContestsCount=data.length;
      if(ContestsCount > 9)
      {
        ContestsCount=9;
      }
      if(ContestsCount>=2)
      {
              for(var i=0;i<ContestsCount;i++)
              {

                var dis = 'Start : '+ GetISTtime(data[i].start) + ' \nEnd : '+GetISTtime(data[i].end);
                var x = new BrowseCarouselItem({
                  title: data[i].event,
                  url: data[i].href,
                  description: dis,
                  image: new Image({
                    url: Image_Url[pname[0]],
                    alt: pname[0],
                  }),
                  footer: getStatus(data[i].start,data[i].end),
                })
                contests.push(x);
              }
              if (!conv.screen) {
                conv.ask('Sorry, try this on a screen device or select the ' +
                  'phone surface in the simulator.');
                return;
              }
              conv.ask(getRandomItem(prompts.ShowResult)+` on ${pname[0]}`);
              conv.ask(new BrowseCarousel({
                items: contests,
              }));
      }
      else if (ContestsCount===1) {
        conv.ask("Here it is");
        conv.ask(new BasicCard({
              text: 'Start : '+ GetISTtime(data[0].start) + '\n End : '+GetISTtime(data[0].end)+'\n'+'Status : ' + getStatus(data[0].start,data[0].end),
              subtitle: pname[0],
              title: data[0].event,
              buttons: new Button({
                title: 'Go to contest page',
                url: data[0].href,
              }),
              image: new Image({
                url: Image_Url[pname[0]],
                alt: pname[0],
              }),
              display: '',
          }));
      }
      else {
        conv.ask(getRandomItem(prompts.NoContests));
      }
      conv.ask(top_plateforms);
      return;
    })
    .catch(()=>{
      conv.ask("errror");
    });
});


exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);
