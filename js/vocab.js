/* Test Prep Hub — Word deck for Words in Context.
   Each entry: "word|part of speech|meaning|example sentence (uses the word exactly, with a clue)|similar words".
   MISSED lists words from the student's own official practice tests; they go into the deck first.
   Example sentences are original. */
(function (root) {
  const RAW = `
contingent|adj|depending on something else to happen|Whether the picnic goes ahead is contingent on the weather: if it rains, it's cancelled.|dependent on, conditional
defunct|adj|no longer existing or working|The video format is now defunct, so few people own a machine that can play those old tapes.|obsolete, extinct
steward|noun|a person who looks after something for others|As steward of the city's archives, she made sure the old maps were cleaned, stored and protected.|caretaker, guardian
sporadic|adj|happening only now and then, not regularly|Unlike the daily rain of the wet season, summer showers here are sporadic, arriving once every week or two.|occasional, irregular
expose|verb|to reveal something that was hidden|The reporter's articles helped expose the factory's secret dumping of waste into the river.|reveal, uncover
fade|verb|to slowly lose color, strength or brightness|The photo had been left in the sun so long that its colors began to fade to pale gray.|dim, weaken
ambiguous|adj|having more than one possible meaning|The sign was ambiguous: "Turn left at the light" could mean either of two lights.|unclear, open to interpretation
austere|adj|plain, simple and without decoration|The monk's room was austere, with only a bed, a chair and a single candle.|severe, bare
succinct|adj|clearly expressed in few words|Her succinct answer took one sentence, while others rambled for minutes.|brief, concise
tentative|adj|not certain or fixed; done carefully as a trial|The team made a tentative plan for Friday but said it could still change.|provisional, hesitant
exhaustive|adj|including every possible detail|The exhaustive report covered every school in the state, one by one.|thorough, complete
derivative|adj|copying others; not original|Critics found the film derivative, since its plot borrowed heavily from older movies.|unoriginal, imitative
novel|adj|new and unlike anything before|Using drones to deliver seeds was a novel idea that no one had tried.|new, original
mundane|adj|ordinary and dull|After the excitement of the trip, going back to mundane chores like laundry felt boring.|everyday, routine
pragmatic|adj|focused on what works in practice|Instead of arguing about the perfect plan, she took a pragmatic approach and fixed the leak first.|practical, realistic
meticulous|adj|very careful about every small detail|The meticulous editor checked every comma and every date twice.|careful, precise
candid|adj|honest and direct|In a candid interview, the coach admitted the team had played poorly.|frank, open
skeptical|adj|doubting that something is true|Scientists were skeptical of the claim until other labs could repeat the results.|doubtful, unconvinced
indifferent|adj|not caring either way|The cat seemed indifferent to the new toy and walked right past it.|uninterested, unconcerned
ambivalent|adj|having mixed feelings|He felt ambivalent about moving: excited by the new city but sad to leave his friends.|torn, uncertain
complacent|adj|too satisfied to try to improve|After winning easily all season, the team grew complacent and stopped practicing hard.|self-satisfied, careless
diligent|adj|hardworking and careful|A diligent student, she reviewed her notes every night, not just before tests.|hardworking, thorough
prolific|adj|producing a great deal|The prolific author wrote more than sixty novels in her lifetime.|productive, fruitful
scarce|adj|in short supply|Water became scarce during the drought, and towns limited how much people could use.|rare, limited
abundant|adj|existing in large amounts|Fish were so abundant in the lake that even beginners caught dozens.|plentiful, ample
negligible|adj|so small it doesn't matter|The price difference was negligible, only a few cents, so we bought the better one.|tiny, insignificant
substantial|adj|large in size, amount or importance|The grant was substantial, enough to pay for three new science labs.|considerable, significant
marginal|adj|small and not very important; at the edge|The new rule made only a marginal difference: test scores rose by less than one point.|slight, minor
profound|adj|very deep or great in effect|The discovery had a profound effect on medicine, changing how doctors treat infections.|deep, far-reaching
superficial|adj|only on the surface; not deep|The repair was superficial: it covered the crack but didn't fix the weak wall beneath.|shallow, surface-level
comprehensive|adj|covering nearly everything|The comprehensive guide included every trail in the park, with maps and difficulty ratings.|complete, wide-ranging
arbitrary|adj|based on chance or whim, not reason|The referee's call seemed arbitrary, since he gave no reason and the replay showed no foul.|random, unjustified
inevitable|adj|certain to happen|With dark clouds overhead and thunder rumbling, rain seemed inevitable.|unavoidable, certain
plausible|adj|seeming reasonable or possibly true|His excuse was plausible, since the buses really were running late that morning.|believable, reasonable
dubious|adj|doubtful; probably not true or good|The ad's claim that the pill cures every illness is dubious.|questionable, suspect
credible|adj|able to be believed or trusted|The witness was credible because her story matched the camera footage.|believable, trustworthy
viable|adj|able to work or succeed|Solar power became a viable option for the village once panels grew cheaper.|workable, feasible
feasible|adj|possible to do|Building the bridge in one year was not feasible, so they planned for three.|doable, achievable
obsolete|adj|out of date and no longer used|Once smartphones arrived, many standalone GPS devices became obsolete.|outdated, defunct
prevalent|adj|widespread; common in a place or time|Bike commuting is prevalent in the city, where almost half of workers ride.|widespread, common
ubiquitous|adj|found everywhere|Coffee shops are ubiquitous downtown, with one on nearly every corner.|everywhere, omnipresent
pervasive|adj|spreading through every part|The smell of smoke was pervasive, reaching every room of the house.|widespread, all-through
rudimentary|adj|basic; at an early, simple stage|The first airplanes had only rudimentary controls compared with today's jets.|basic, primitive
sophisticated|adj|complex and advanced|The sophisticated software could recognize faces in a crowd.|advanced, complex
intricate|adj|having many small, connected parts|The rug had an intricate pattern of tiny interlocking flowers.|detailed, complex
crucial|adj|extremely important|Getting enough sleep is crucial before a big test.|vital, essential
peripheral|adj|on the edge; not central|The meeting covered the budget first; peripheral issues like decorations came last.|minor, outer
integral|adj|necessary to make something complete|Teamwork was integral to the project; no one could have finished it alone.|essential, fundamental
inherent|adj|existing as a natural, built-in part|Some risk is inherent in rock climbing, no matter how careful you are.|built-in, natural
intrinsic|adj|belonging to something's basic nature|She read for the intrinsic joy of it, not for grades or prizes.|built-in, essential
explicit|adj|stated clearly and directly|The rules were explicit: no phones during the exam, written in bold on the board.|clear, direct
implicit|adj|suggested but not stated directly|Her silence carried an implicit message: she did not agree.|implied, unspoken
tacit|adj|understood without being said|There was a tacit agreement that whoever cooked would not wash the dishes.|unspoken, implied
overt|adj|done openly; not hidden|His overt support for the plan, announced at the meeting, surprised everyone.|open, obvious
covert|adj|secret or hidden|The covert mission was kept from the public for years.|secret, hidden
lucid|adj|clear and easy to understand|Her lucid explanation made a hard topic simple.|clear, understandable
opaque|adj|hard to see through or to understand|The contract's language was so opaque that even the lawyer had to read it twice.|unclear, murky
coherent|adj|logical and well organized|After the edits, the essay was coherent, with each paragraph leading to the next.|logical, organized
eloquent|adj|expressing ideas clearly and movingly|The eloquent speech brought many in the audience to tears.|well-spoken, expressive
concise|adj|giving a lot of information in few words|Keep the summary concise: no more than three sentences.|brief, succinct
verbose|adj|using more words than needed|The verbose instructions took two pages to explain how to turn on a lamp.|wordy, long-winded
terse|adj|short and a little rude|His terse reply, "Fine," showed he was still annoyed.|curt, abrupt
benevolent|adj|kind and wanting to help|The benevolent donor paid for every student's field trip.|kind, generous
hostile|adj|unfriendly and opposed|The crowd was hostile, booing the visiting team as soon as it appeared.|unfriendly, aggressive
amiable|adj|friendly and pleasant|The amiable shopkeeper greeted every customer by name.|friendly, good-natured
aloof|adj|distant and not friendly|The new student seemed aloof at first, sitting alone and saying little.|distant, reserved
reticent|adj|not willing to share thoughts or feelings|Usually reticent, he surprised his class by speaking up about his family's history.|reserved, quiet
gregarious|adj|enjoying the company of others|Gregarious by nature, she knew someone at every table in the cafeteria.|sociable, outgoing
resilient|adj|able to recover quickly from trouble|The resilient town rebuilt every shop within a year of the flood.|tough, adaptable
fragile|adj|easily broken or damaged|The fragile vase was wrapped in three layers of bubble wrap.|delicate, breakable
robust|adj|strong and able to handle stress|The robust design let the phone survive a fall onto concrete.|sturdy, strong
volatile|adj|likely to change suddenly|Prices were volatile, jumping up one week and crashing the next.|unstable, unpredictable
stagnant|adj|not moving, flowing or growing|Mosquitoes bred in the stagnant water of the old pond.|still, inactive
dynamic|adj|always changing and active|The city's dynamic music scene had new bands playing every night.|energetic, changing
static|adj|not moving or changing|Population in the village stayed static for decades: about 400 people, year after year.|unchanging, fixed
gradual|adj|happening slowly over time|The gradual slope made the hike easy, rising only a little each mile.|slow, steady
abrupt|adj|sudden and unexpected|The bus made an abrupt stop, throwing passengers forward.|sudden, sharp
incessant|adj|never stopping|The incessant barking kept the neighbors awake all night.|constant, nonstop
intermittent|adj|stopping and starting at intervals|The signal was intermittent, cutting in and out during the call.|on-and-off, sporadic
perpetual|adj|lasting forever or for a very long time|The mountain peak was covered in perpetual snow, even in summer.|endless, permanent
transient|adj|lasting only a short time|The rainbow was transient, gone within minutes.|brief, temporary
ephemeral|adj|lasting a very short time|Fame on social media is often ephemeral, forgotten by next week.|fleeting, short-lived
enduring|adj|lasting a long time|The enduring popularity of the song kept it on the radio for decades.|lasting, long-lived
nascent|adj|just beginning to develop|The nascent company had only three employees and a borrowed office.|new, emerging
burgeoning|adj|growing quickly|The burgeoning town added a new school every few years to keep up.|booming, expanding
dormant|adj|inactive for now but able to wake|The volcano had been dormant for centuries before it began to rumble.|inactive, sleeping
latent|adj|present but not yet visible or active|Her latent talent for drawing appeared only when she took her first art class.|hidden, undeveloped
conspicuous|adj|easy to notice|In his bright orange jacket, he was conspicuous in the crowd.|noticeable, obvious
inconspicuous|adj|not easily noticed|The camera was small and inconspicuous, hidden on a bookshelf.|unnoticeable, discreet
discreet|adj|careful not to attract attention or reveal secrets|She was discreet and never repeated what friends told her in private.|careful, tactful
prudent|adj|wise and careful about the future|It's prudent to save some money for emergencies.|sensible, cautious
reckless|adj|not caring about danger|The reckless driver sped through a red light.|careless, rash
cautious|adj|careful to avoid risk|Cautious hikers turned back when the storm clouds gathered.|careful, wary
impartial|adj|fair and not taking sides|An impartial judge treats both sides the same way.|neutral, unbiased
biased|adj|unfairly favoring one side|The survey was biased because it asked only fans of the team.|one-sided, partial
objective|adj|based on facts, not feelings|A thermometer gives an objective measure of temperature.|factual, neutral
subjective|adj|based on personal feelings or opinions|Whether a painting is beautiful is subjective; people disagree.|personal, opinion-based
empirical|adj|based on observation or experiment|The theory had no empirical support until researchers ran the experiment.|observed, evidence-based
hypothetical|adj|imagined as a possibility, not real|In a hypothetical case where the dam fails, the town would flood in an hour.|imagined, supposed
anomalous|adj|different from what is normal or expected|One anomalous reading was far higher than all the others, so they checked the sensor.|abnormal, unusual
typical|adj|normal for its type|A typical school day starts at eight and ends at three.|usual, standard
singular|adj|unusual and remarkable; one of a kind|Her singular talent set her apart from every other pianist in the contest.|unique, exceptional
uniform|adj|the same throughout|The tiles were uniform, each one exactly the same size and color.|consistent, identical
disparate|adj|very different from each other|The club brought together disparate groups: farmers, artists and engineers.|different, unlike
analogous|adj|similar in a way that allows comparison|The heart is analogous to a pump, pushing fluid through pipes.|comparable, similar
distinct|adj|clearly different or separate|The two bird calls are distinct: one is a whistle, the other a croak.|different, separate
divergent|adj|moving apart; different|The two scientists reached divergent conclusions from the same data.|differing, opposing
convergent|adj|coming together toward one point|Their convergent findings, reached in separate labs, made the result stronger.|meeting, agreeing
compatible|adj|able to exist or work together|The charger is compatible with both phones.|consistent, matching
contradictory|adj|opposing each other|The two reports were contradictory: one said sales rose, the other said they fell.|conflicting, inconsistent
consistent|adj|always the same; in agreement|Her results were consistent, landing near 90% on every quiz.|steady, reliable
undermine|verb|to weaken something, often gradually|Constant rumors began to undermine trust in the club's leaders.|weaken, erode
bolster|verb|to support or strengthen|New evidence helped bolster the scientist's theory.|strengthen, reinforce
corroborate|verb|to confirm with more evidence|Two other witnesses came forward to corroborate her account.|confirm, support
refute|verb|to prove something wrong|The data refute the claim that the new drug works better.|disprove, rebut
undercut|verb|to weaken or make less effective|Missing data undercut the study's conclusion.|weaken, undermine
validate|verb|to show that something is true or correct|Later experiments helped validate the early findings.|confirm, verify
challenge|verb|to question whether something is true|The new fossil seemed to challenge the accepted timeline of when birds evolved.|question, dispute
advocate|verb|to publicly support|The students advocate for a longer lunch period at every board meeting.|support, champion
endorse|verb|to approve of publicly|Several doctors endorse the new safety guidelines.|support, back
oppose|verb|to be against|Many residents oppose the plan to close the library.|resist, object to
concede|verb|to admit something is true, often unwillingly|The candidate had to concede that her opponent had won.|admit, acknowledge
assert|verb|to state something firmly|The author asserts that sleep matters more than diet for health.|claim, declare
contend|verb|to argue or claim|Some historians contend that the war began years earlier than usually thought.|argue, maintain
speculate|verb|to guess without firm evidence|Without the missing pages, we can only speculate about how the story ended.|guess, theorize
infer|verb|to figure out from clues|From the wet umbrella, I could infer that it was raining outside.|conclude, deduce
imply|verb|to suggest without saying directly|Her frown seemed to imply that she disliked the idea.|suggest, hint
illustrate|verb|to explain with examples|The teacher used a pizza to illustrate how fractions work.|show, demonstrate
convey|verb|to communicate or express|The painting conveys a feeling of calm with soft blues and greens.|express, communicate
depict|verb|to show in a picture or words|The mural depicts farmers harvesting wheat at sunset.|show, portray
portray|verb|to show or describe in a certain way|The film portrays the inventor as a lonely genius.|depict, represent
render|verb|to make or cause to become|The heavy rain will render the field too muddy to play on.|make, cause to be
mitigate|verb|to make less severe|Planting trees can help mitigate flooding by soaking up rainwater.|lessen, reduce
alleviate|verb|to make pain or trouble easier to bear|The medicine helped alleviate her headache.|ease, relieve
exacerbate|verb|to make a problem worse|Scratching will only exacerbate the itch.|worsen, aggravate
augment|verb|to increase or add to|She took a summer job to augment her savings.|increase, boost
diminish|verb|to become or make smaller|The noise began to diminish as the parade moved away.|decrease, lessen
curtail|verb|to cut short or limit|The storm forced the town to curtail the fireworks show after ten minutes.|limit, cut back
hinder|verb|to get in the way of|Heavy snow hindered the rescue team's progress.|block, slow
impede|verb|to slow or block progress|Fallen trees impede traffic on the mountain road.|obstruct, hinder
facilitate|verb|to make easier|The new app facilitates sharing notes with classmates.|ease, enable
foster|verb|to encourage the growth of|Group projects can foster teamwork.|encourage, promote
cultivate|verb|to develop over time with care|She worked to cultivate good study habits.|develop, nurture
sustain|verb|to keep going over time|The runners ate snacks to sustain their energy during the race.|maintain, support
preserve|verb|to keep safe and unchanged|The museum works to preserve old letters from damage.|protect, conserve
discard|verb|to throw away|Discard any batteries that leak.|throw out, get rid of
retain|verb|to keep or hold on to|The soil retains water well, so plants rarely dry out.|keep, hold
relinquish|verb|to give up or let go of|The king refused to relinquish his power.|surrender, give up
acquire|verb|to get or gain|The museum hopes to acquire the famous painting next year.|obtain, gain
allocate|verb|to set aside for a purpose|The school will allocate more money to the library.|assign, distribute
compile|verb|to collect and put together|She compiled a list of every book she read this year.|gather, assemble
synthesize|verb|to combine parts into a whole|The report synthesizes findings from twenty different studies.|combine, integrate
scrutinize|verb|to examine very closely|The detective scrutinized the letter for any clue.|inspect, examine
overlook|verb|to fail to notice|It's easy to overlook a small typo when you're rushing.|miss, neglect
neglect|verb|to fail to take care of|If you neglect a plant, it will wilt.|ignore, abandon
emulate|verb|to try to match or copy someone you admire|Young players often emulate the stars they watch on TV.|imitate, copy
replicate|verb|to repeat or copy exactly|Other labs could not replicate the surprising result.|reproduce, duplicate
supplant|verb|to take the place of|Email has largely supplanted handwritten letters.|replace, displace
reconcile|verb|to make two things agree or fit together|It was hard to reconcile his kind words with his rude actions.|harmonize, settle
deviate|verb|to move away from the usual path|The pilot had to deviate from the planned route to avoid the storm.|stray, depart
adhere|verb|to stick to or follow closely|Players must adhere to the rules of the game.|follow, stick to
comply|verb|to do what is asked or required|Drivers must comply with the speed limit.|obey, follow
circumvent|verb|to find a way around|They built a tunnel to circumvent the crowded intersection.|get around, bypass
precipitate|verb|to cause something to happen suddenly|The bank's failure helped precipitate a wider crisis.|trigger, bring on
elicit|verb|to draw out a response|The joke failed to elicit a single laugh.|draw out, provoke
evoke|verb|to bring a feeling or memory to mind|The smell of cinnamon evokes memories of my grandmother's kitchen.|call up, summon
provoke|verb|to cause a strong reaction|The unfair call provoked angry shouts from the fans.|cause, spark
deter|verb|to discourage from acting|Bright lights help deter burglars.|discourage, prevent
compel|verb|to force or strongly push someone to act|The evidence compelled the jury to change its mind.|force, drive
yield|verb|to produce, or to give way|The orchard yields thousands of apples each fall.|produce, give
exemplify|verb|to be a typical example of|Her calm under pressure exemplifies good leadership.|represent, typify
underscore|verb|to emphasize|The flood underscores the need for better drains.|stress, highlight
ascertain|verb|to find out for certain|Investigators worked to ascertain the cause of the fire.|determine, discover
discern|verb|to notice or recognize, often with effort|In the fog, it was hard to discern the shape of the boat.|detect, make out
dismiss|verb|to treat as not worth considering|At first, experts dismissed the idea as impossible.|reject, disregard
embrace|verb|to accept eagerly|The town embraced the new recycling program.|welcome, adopt
reluctant|adj|not wanting to do something|He was reluctant to jump into the cold lake.|unwilling, hesitant
eager|adj|wanting very much to do something|The eager volunteers arrived an hour early.|keen, enthusiastic
apprehensive|adj|worried something bad will happen|She was apprehensive about the results, checking her phone every few minutes.|anxious, nervous
indignant|adj|angry at something unfair|The players were indignant when the referee ignored the obvious foul.|offended, outraged
nostalgic|adj|longing for the past|Old photos made him nostalgic for summers at the lake.|sentimental, wistful
wary|adj|careful because of possible danger|The deer stayed wary, lifting its head at every sound.|cautious, alert
zealous|adj|full of strong energy for a cause|The zealous fans painted their faces and cheered for four hours straight.|passionate, fervent
earnest|adj|serious and sincere|In an earnest voice, he promised to do better.|sincere, serious
whimsical|adj|playful and fanciful|The whimsical garden had teacup planters and a dragon-shaped hedge.|playful, quirky
somber|adj|dark, serious or sad|The mood at the ceremony was somber as people remembered those lost.|gloomy, grave
jubilant|adj|filled with great joy|The jubilant crowd poured onto the field after the win.|joyful, triumphant
wistful|adj|sadly longing for something|She gave a wistful look at the beach as the car drove away.|longing, nostalgic
dismissive|adj|showing that something isn't worth attention|His dismissive shrug made it clear he didn't care about her idea.|scornful, uninterested
reverent|adj|showing deep respect|Visitors spoke in reverent whispers inside the old cathedral.|respectful, awed
irreverent|adj|showing a lack of respect, often in a funny way|The comedian's irreverent jokes about the mayor made the crowd laugh.|disrespectful, cheeky
ironic|adj|the opposite of what you would expect|It was ironic that the fire station burned down.|unexpected, contrary
acclaim|noun|enthusiastic public praise|The novel received wide acclaim and won three awards.|praise, applause
scrutiny|noun|close, careful examination|The new law came under scrutiny from judges and reporters.|inspection, examination
consensus|noun|general agreement|There is a broad consensus among scientists that the planet is warming.|agreement, accord
paradox|noun|a statement that seems to contradict itself but may be true|It's a paradox that the more choices people have, the harder it can be to choose.|contradiction, puzzle
catalyst|noun|something that causes a change|The new coach was the catalyst for the team's turnaround.|trigger, spark
precedent|noun|an earlier event used as an example|The court's decision set a precedent for future cases.|model, example
impetus|noun|a force that pushes something forward|The flood gave the town the impetus to build a stronger levee.|motivation, push
proponent|noun|a person who supports an idea|A strong proponent of bike lanes, she spoke at every council meeting.|supporter, advocate
critic|noun|a person who finds fault or judges|Even the film's harshest critic praised the music.|detractor, reviewer
skeptic|noun|a person who doubts claims|A lifelong skeptic, he wanted to see the evidence himself.|doubter, questioner
novice|noun|a beginner|As a novice, she started on the easiest ski slope.|beginner, newcomer
pioneer|noun|one of the first to do something|She was a pioneer in computer science, writing some of the first programs.|trailblazer, innovator
advent|noun|the arrival of something important|The advent of the printing press made books cheaper.|arrival, coming
array|noun|a large, varied group|The shop sells a wide array of teas from around the world.|range, collection
facet|noun|one side or part of something|Cost is only one facet of the decision.|aspect, side
nuance|noun|a small, subtle difference|A good translator captures every nuance of meaning.|subtlety, shade
premise|noun|an idea on which an argument is based|The essay's premise is that schools should start later.|basis, assumption
rationale|noun|the reasons behind a decision|The principal explained the rationale for the new schedule.|reasoning, justification
disparity|noun|a large difference|There is a disparity between how much the two jobs pay.|gap, inequality
deficit|noun|a shortage; an amount too small|The team faced a ten-point deficit at halftime.|shortfall, lack
surplus|noun|an amount more than needed|The farm had a surplus of tomatoes, so they gave the extras away.|excess, extra
`;
  const MISSED = { contingent: "Missed on Practice Test 2", defunct: "Missed on Practice Test 2", steward: "Missed on Practice Test 3", sporadic: "Missed on Practice Test 3", expose: "Missed on Practice Test 3 (\"exposing\")", fade: "Missed in practice" };
  const WORDS = RAW.trim().split("\n").map((l) => { const [w, p, d, s, syn] = l.split("|"); return { w, p, d, s, syn, missed: MISSED[w] || null }; });
  root.VOCAB = { WORDS, MISSED };
})(typeof window !== "undefined" ? window : globalThis);
