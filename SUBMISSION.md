# skin's leaderboard prototype

## How to Run

It runs the exact same way the files given to me run. I did try to convert the TypeScript files into JavaScript such that someone could run the index.html file, but it broke a lot of things within the leaderboards for some reason. Regardless, the steps to do so are:

 - Installing the base dependencies and choosing React (make sure you already have Node.js 24.x installed, it doesn't like v26 for some reason):

 ```bash
 npm install
 npm run setup:frontend --react
 ```

 - Then start the development server with:

 ```bash
 npm run dev
 ```

 - Finally, open `localhost:3000` on your web browser of choice and gaze in awe (if things go well).

## What I Built/Time Spent

I spent a total of 5 hours on this assignment, although 2 of those hours were me attempting to do more than explicitly asked for and paying for it dearly.

I spent the first 5-10 mocking up what the finished product might look like. I've inserted an image of my mockup (drawn on a sticky note) below:
![Very Poor Diagram](https://media.discordapp.net/attachments/694061529846251543/1539475483371241513/IMG_8157.jpg?ex=6a8673c5&is=6a852245&hm=71e4a573f1bcc22a0202674c33b6b2031e16112b2310c033fd8a808aae5b6754&=&format=webp&width=1152&height=1536)

I spent the next 20 minutes going over what files were provided and figuring out what ideas were viable and what weren't. I also got a little confused setting up the working environment but I figured things out.

I spent the rest of my 3 hours working on the individual sections. I would estimate I spent an hour making the leaderboard search and overall view, and closer to an hour and a half on the leaderboard details (mainly because I had to check what the slug gave me in terms of information and then decide what I wanted to keep in). I also added a dark mode because it helped my eyes and was also very easy to implement.

I thought it would make things much more presentable if I could allow the index.html file to be run through a local web server, as mentioned above, and I spent 2 hours trying to fix things after my first attempt broke the leaderboards, although I was not successful.

In terms of AI usage, I used Gemini to create a basic template for the page, after which I manually fixed any issues the generated code had and cleaned up the website visually, and manually added some QoL features, like the Official and Featured checkmarks, and the WBO logo.

## Assumptions and Scope

I decided to skip the markers that indicated how ELO had changed from the detailed leaderboard data, as I felt that it overcomplicated the design of the leaderboard page. I also felt that including whether a tournament was Open or Masters format felt redundant as a leaderboard that was Open format would have Open format tournaments, and vice-versa.

## Notable Decisions

I decided that displaying an overall win-loss record was more important than displaying the latest change in ELO. It felt like a much more quantifiable number to the average viewer than ELO, a ranking system they might not understand the intricacies of or why a certain-point increase or decrease might be significant apart from its overall implication to rankings. A win-loss counter having a lot more wins than losses will make even the average player think "Wow, this person's good." or seeing a low number on both sides will make someone understand that their current placing is probably due to a lack of many tournament entries.

## Testing

I really just tested different variations of the leaderboard search page to see which made the most sense, and ended up going with something fairly simple in the end. I also tested having ELO changes display vs. having the win-loss ratio display, and also moving the country indicator to the very left (which I think would look much better with flags instead of letters, which made things too confusing).

I also used the Inspect window on the browser I was using to see how my page looked on different resolutions.

## What I'd Do With More Time

With more time, I'd want to improve both pages visually. I'd also like to replace the two-letter country indicators with flags. I also didn't realize there were player profiles... they might have been a more efficient usage of my time although I feel like I did the most with the time I had. I'd also want to have official and featured leaderboards automatically appear at the top of the screen. That's something I only thought about while writing this up, and I'd implement that right now if I wasn't already over on time.
