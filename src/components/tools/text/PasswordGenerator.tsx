import React, { useState, useEffect, useCallback, useMemo } from "react"

import { ToolLayout } from "@/components/layout/ToolLayout"
import { PillToggle } from "@/components/shared/PillToggle"
import { KeyRound, RefreshCw, Copy, CheckCircle, ShieldAlert, ShieldCheck, Shield, List, Type, Fingerprint, Download, Lock, Unlock, Hash, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard"
import { useDownload } from "@/hooks/useDownload"

type PasswordMode = "random" | "passphrase" | "pronounceable"

const WORDS = [
  "abandon", "ability", "able", "about", "above", "absent", "absorb", "abstract", "absurd", "abuse", "access", "accident", "account", "accuse", "achieve", "acid", "acoustic", "acquire", "across", "act", "action", "actor", "actress", "actual", "adapt", "add", "addict", "address", "adjust", "admit", "adult", "advance", "advice", "aerobic", "affair", "afford", "afraid", "again", "age", "agent", "agree", "ahead", "aim", "air", "airport", "aisle", "alarm", "album", "alcohol", "alert", "alien", "all", "alley", "allow", "almost", "alone", "alpha", "already", "also", "alter", "always", "amateur", "amazing", "among", "amount", "amused", "analyst", "anchor", "ancient", "anger", "angle", "angry", "animal", "ankle", "announce", "annual", "another", "answer", "antenna", "antique", "anxiety", "any", "apart", "apology", "appear", "apple", "approve", "april", "arch", "arctic", "area", "arena", "argue", "arm", "armed", "armor", "army", "around", "arrange", "arrest", "arrive", "arrow", "art", "artefact", "artist", "artwork", "ask", "aspect", "assault", "asset", "assist", "assume", "asthma", "athlete", "atom", "attack", "attend", "attitude", "attract", "auction", "audit", "august", "aunt", "author", "auto", "autumn", "average", "avocado", "avoid", "awake", "aware", "away", "awesome", "awful", "awkward", "axis", "baby", "bachelor", "bacon", "badge", "bag", "balance", "balcony", "ball", "bamboo", "banana", "banner", "bar", "barely", "bargain", "barrel", "base", "basic", "basket", "battle", "beach", "beam", "bean", "beauty", "because", "become", "beef", "before", "begin", "behave", "behind", "believe", "below", "belt", "bench", "benefit", "best", "betray", "better", "between", "beyond", "bicycle", "bid", "bike", "bind", "biology", "bird", "birth", "bitter", "black", "blade", "blame", "blanket", "blast", "bleak", "bless", "blind", "blood", "blossom", "blouse", "blue", "blur", "blush", "board", "boat", "body", "boil", "bomb", "bone", "bonus", "book", "boost", "border", "boring", "borrow", "boss", "bottom", "bounce", "box", "boy", "bracket", "brain", "brand", "brass", "brave", "bread", "breeze", "brick", "bridge", "brief", "bright", "bring", "brisk", "broccoli", "broken", "bronze", "broom", "brother", "brown", "brush", "bubble", "buddy", "budget", "buffalo", "build", "bulb", "bulk", "bullet", "bundle", "bunker", "burden", "burger", "burst", "bus", "business", "busy", "butter", "buyer", "buzz", "cabbage", "cabin", "cable", "cactus", "cage", "cake", "call", "calm", "camera", "camp", "can", "canal", "cancel", "candy", "cannon", "canoe", "canvas", "canyon", "capable", "capital", "captain", "caption", "car", "carbon", "card", "cargo", "carpet", "carry", "cart", "case", "cash", "casino", "castle", "casual", "cat", "catalog", "catch", "category", "cattle", "caught", "cause", "caution", "cave", "ceiling", "celery", "cement", "census", "century", "cereal", "certain", "chair", "chalk", "champion", "change", "chaos", "chapter", "charge", "chase", "chat", "cheap", "check", "cheese", "chef", "cherry", "chest", "chicken", "chief", "child", "chimney", "choice", "choose", "chronic", "chuckle", "chunk", "churn", "cigar", "cinema", "circle", "citizen", "city", "civil", "claim", "clap", "clarify", "claw", "clay", "clean", "clerk", "clever", "click", "client", "cliff", "climb", "clinic", "clip", "clock", "clog", "close", "cloth", "cloud", "clown", "club", "clump", "cluster", "clutch", "coach", "coast", "coconut", "code", "coffee", "coil", "coin", "collect", "color", "column", "combine", "come", "comfort", "comic", "common", "company", "compass", "compete", "complete", "confirm", "congrat", "connect", "consider", "control", "convince", "cook", "cool", "copper", "copy", "coral", "core", "corn", "correct", "cost", "cotton", "couch", "country", "couple", "course", "cousin", "cover", "coyote", "crack", "cradle", "craft", "cram", "crane", "crash", "crater", "crawl", "crazy", "cream", "credit", "creek", "crew", "cricket", "crime", "crisp", "critic", "crop", "cross", "crouch", "crowd", "crucial", "cruel", "cruise", "crumble", "crunch", "crush", "cry", "crystal", "cube", "culture", "cup", "cupboard", "curious", "current", "curtain", "curve", "cushion", "custom", "cute", "cycle", "dad", "damage", "damp", "dance", "danger", "daring", "dash", "daughter", "dawn", "day", "deal", "debate", "debris", "decade", "december", "decide", "decline", "decorate", "decrease", "deer", "defense", "define", "defy", "degree", "delay", "deliver", "demand", "demise", "denial", "dentist", "deny", "depart", "depend", "deposit", "depth", "deputy", "derive", "describe", "desert", "design", "desk", "despair", "destroy", "detail", "detect", "device", "devote", "diagram", "dial", "diamond", "diary", "dice", "diesel", "diet", "differ", "digital", "dignity", "dilemma", "dinner", "dinosaur", "direct", "dirt", "disagree", "discover", "disease", "dish", "dismiss", "disorder", "display", "distance", "divert", "divide", "divorce", "dizzy", "doctor", "document", "dog", "doll", "dolphin", "domain", "donate", "donkey", "donor", "door", "dose", "double", "dove", "draft", "dragon", "drama", "drastic", "draw", "dream", "dress", "drift", "drill", "drink", "drip", "drive", "drop", "drum", "dry", "duck", "dumb", "dune", "during", "dust", "dutch", "duty", "dwarf", "dynamic", "eager", "eagle", "early", "earn", "earth", "easily", "east", "easy", "echo", "ecology", "economy", "edge", "edit", "educate", "effort", "egg", "eight", "either", "elbow", "elder", "electric", "elegant", "element", "elephant", "elevator", "elite", "else", "embark", "embody", "embrace", "emerge", "emotion", "employ", "empower", "empty", "enable", "enact", "end", "endless", "endorse", "enemy", "energy", "enforce", "engage", "engine", "enhance", "enjoy", "enlist", "enough", "enrich", "enroll", "ensure", "enter", "entire", "entry", "envelope", "episode", "equal", "equip", "era", "erase", "erode", "erosion", "error", "erupt", "escape", "essay", "essence", "estate", "eternal", "ethics", "evidence", "evil", "evoke", "evolve", "exact", "example", "excess", "exchange", "excite", "exclude", "excuse", "execute", "exercise", "exhaust", "exhibit", "exile", "exist", "exit", "exotic", "expand", "expect", "expire", "explain", "expose", "express", "extend", "extra", "eye", "eyebrow", "fabric", "face", "faculty", "fade", "faint", "faith", "fall", "false", "fame", "family", "famous", "fan", "fancy", "fantasy", "farm", "fashion", "fat", "fatal", "father", "fatigue", "fault", "favorite", "feature", "february", "federal", "fee", "feed", "feel", "female", "fence", "festival", "fetch", "fever", "few", "fiber", "fiction", "field", "figure", "file", "film", "filter", "final", "find", "fine", "finger", "finish", "fire", "firm", "first", "fiscal", "fish", "fit", "fitness", "five", "fix", "flag", "flame", "flash", "flat", "flavor", "flee", "flight", "flip", "float", "flock", "floor", "flower", "fluid", "flush", "fly", "foam", "focus", "fog", "foil", "fold", "follow", "food", "foot", "force", "forest", "forget", "fork", "fortune", "forum", "forward", "fossil", "foster", "found", "fox", "fragile", "frame", "frequent", "fresh", "friend", "fringe", "frog", "front", "frost", "frown", "frozen", "fruit", "fuel", "fun", "funny", "furnace", "fury", "future", "gadget", "gain", "galaxy", "gallery", "game", "gap", "garage", "garbage", "garden", "garlic", "garment", "gas", "gasp", "gate", "gather", "gauge", "gaze", "general", "genius", "genre", "gentle", "genuine", "gesture", "ghost", "giant", "gift", "giggle", "ginger", "giraffe", "girl", "give", "glad", "glance", "glare", "glass", "glide", "glimpse", "globe", "gloom", "glory", "glove", "glow", "glue", "goat", "goddess", "gold", "good", "goose", "gorilla", "gospel", "gossip", "govern", "gown", "grab", "grace", "grain", "grant", "grape", "grass", "gravity", "great", "green", "grid", "grief", "grit", "grocery", "group", "grow", "grunt", "guard", "guess", "guide", "guilt", "guitar", "gun", "gym", "habit", "hair", "half", "hammer", "hamster", "hand", "happy", "harbor", "hard", "harsh", "harvest", "hat", "have", "hawk", "hazard", "head", "health", "heart", "heavy", "hedgehog", "height", "hello", "helmet", "help", "hen", "hero", "hidden", "high", "hill", "hint", "hip", "hire", "history", "hobby", "hockey", "hold", "hole", "holiday", "hollow", "home", "honey", "hood", "hope", "horn", "horror", "horse", "hospital", "host", "hotel", "hour", "hover", "hub", "huge", "human", "humble", "humor", "hundred", "hungry", "hunt", "hurdle", "hurry", "hurt", "husband", "hybrid", "ice", "icon", "idea", "identify", "idle", "ignore", "ill", "illegal", "illness", "image", "imitate", "immense", "immune", "impact", "impose", "improve", "impulse", "inch", "include", "income", "increase", "index", "indicate", "indoor", "industry", "infant", "inflict", "inform", "inhale", "inherit", "initial", "inject", "injury", "inmate", "inner", "innocent", "input", "inquiry", "insane", "insect", "inside", "inspire", "install", "intact", "interest", "into", "invest", "invite", "involve", "iron", "island", "isolate", "issue", "item", "ivory", "jacket", "jaguar", "jar", "jazz", "jealous", "jeans", "jelly", "jewel", "job", "join", "joke", "journey", "joy", "judge", "juice", "jump", "jungle", "junior", "junk", "just", "kangaroo", "keen", "keep", "ketchup", "key", "kick", "kid", "kidney", "kind", "kingdom", "kiss", "kit", "kitchen", "kite", "kitten", "kiwi", "knee", "knife", "knock", "know", "lab", "label", "labor", "ladder", "lady", "lake", "lamp", "language", "laptop", "large", "later", "latin", "laugh", "laundry", "lava", "law", "lawn", "lawsuit", "layer", "lazy", "leader", "leaf", "learn", "leave", "lecture", "left", "leg", "legal", "legend", "leisure", "lemon", "lend", "length", "lens", "leopard", "lesson", "letter", "level", "liar", "liberty", "library", "license", "life", "lift", "light", "like", "limb", "limit", "link", "lion", "liquid", "list", "little", "live", "lizard", "load", "loan", "lobster", "local", "lock", "logic", "lonely", "long", "loop", "lottery", "loud", "lounge", "love", "loyal", "lucky", "luggage", "lumber", "lunar", "lunch", "luxury", "lyrics", "machine", "mad", "magic", "magnet", "maid", "mail", "main", "major", "make", "mammal", "man", "manage", "mandate", "mango", "mansion", "manual", "maple", "marble", "march", "margin", "marine", "market", "marriage", "mask", "mass", "master", "match", "material", "math", "matrix", "matter", "maximum", "maze", "meadow", "mean", "measure", "meat", "mechanic", "medal", "media", "melody", "melt", "member", "memory", "mention", "menu", "mercy", "merge", "merit", "merry", "mesh", "message", "metal", "method", "middle", "midnight", "mild", "milk", "miller", "million", "mimic", "mind", "minimum", "minor", "minute", "miracle", "mirror", "misery", "miss", "mistake", "mix", "mixed", "mixture", "mobile", "model", "modify", "moment", "monitor", "monkey", "monster", "month", "moon", "moral", "more", "morning", "mosquito", "mother", "motion", "motor", "mountain", "mouse", "move", "movie", "much", "muffin", "mule", "multiply", "muscle", "museum", "mushroom", "music", "must", "mutual", "myself", "mystery", "myth", "naive", "name", "napkin", "narrow", "nasty", "nation", "nature", "near", "nearly", "nebula", "neck", "need", "negative", "neglect", "neither", "nephew", "nerve", "nest", "net", "network", "neutral", "never", "new", "news", "next", "nice", "night", "nimble", "nine", "noble", "noise", "nominee", "none", "noon", "nor", "north", "nose", "notable", "note", "nothing", "notice", "novel", "now", "nuclear", "number", "nurse", "nut", "oak", "obey", "object", "oblige", "obscure", "observe", "obtain", "obvious", "occur", "ocean", "october", "odor", "off", "offer", "office", "often", "oil", "okay", "old", "olive", "olympic", "omit", "once", "one", "onion", "online", "only", "open", "opera", "opinion", "oppose", "option", "orange", "orbit", "orchard", "order", "ordinary", "organ", "orient", "origin", "orphan", "ostrich", "other", "outdoor", "outer", "output", "outside", "oval", "oven", "over", "own", "owner", "oxygen", "oyster", "ozone", "pact", "paddle", "page", "pair", "palace", "palm", "panda", "panel", "panic", "panther", "paper", "parade", "parent", "park", "parrot", "party", "pass", "patch", "path", "patient", "patrol", "pattern", "pause", "pave", "payment", "peace", "peanut", "pear", "peasant", "pelican", "pen", "penalty", "pencil", "people", "pepper", "perfect", "permit", "person", "pet", "phone", "photo", "phrase", "physical", "piano", "picnic", "picture", "piece", "pig", "pigeon", "pill", "pilot", "pink", "pioneer", "pipe", "pistol", "pitch", "pixel", "pizza", "place", "planet", "plastic", "plate", "play", "please", "pledge", "pluck", "plug", "plunge", "poem", "poet", "point", "polar", "pole", "police", "pond", "pony", "pool", "popular", "portion", "position", "possible", "post", "potato", "pottery", "poverty", "powder", "power", "practice", "praise", "predict", "prefer", "prepare", "present", "pretty", "prevent", "price", "pride", "primary", "print", "priority", "prison", "private", "prize", "problem", "process", "produce", "profit", "program", "project", "promote", "proof", "proper", "propel", "protect", "proud", "provide", "public", "pudding", "pull", "pulp", "pulse", "pumpkin", "punch", "pupil", "puppy", "purchase", "purity", "purpose", "purse", "push", "put", "puzzle", "pyramid", "quality", "quantum", "quarter", "question", "quick", "quit", "quiz", "quote", "rabbit", "raccoon", "race", "rack", "radar", "radio", "rail", "rain", "raise", "rally", "ramp", "ranch", "random", "range", "rapid", "rare", "rate", "rather", "raven", "raw", "razor", "ready", "real", "reason", "rebel", "rebuild", "recall", "receive", "recipe", "record", "recycle", "reduce", "reflect", "reform", "refuse", "region", "regret", "regular", "reject", "relax", "release", "relief", "rely", "remain", "remember", "remind", "remove", "render", "renew", "rent", "reopen", "repair", "repeat", "replace", "report", "require", "rescue", "resemble", "resist", "resource", "respond", "result", "retire", "retreat", "return", "reunion", "reveal", "review", "reward", "rhythm", "rib", "ribbon", "rice", "rich", "ride", "ridge", "rifle", "right", "rigid", "ring", "riot", "ripple", "risk", "ritual", "rival", "river", "road", "roast", "robot", "robust", "rocket", "romance", "roof", "rookie", "room", "rose", "rotate", "rough", "round", "route", "royal", "rubber", "rude", "rug", "rule", "run", "runway", "rural", "sad", "saddle", "sadness", "safe", "sail", "salad", "salmon", "salon", "salt", "salute", "same", "sample", "sand", "satisfy", "saturday", "sauce", "sausage", "save", "say", "scale", "scan", "scare", "scatter", "scene", "scheme", "school", "science", "scissors", "scorpion", "scout", "scrap", "screen", "script", "scrub", "sea", "search", "season", "seat", "second", "secret", "section", "security", "seed", "seek", "segment", "select", "sell", "seminar", "senior", "sense", "sentence", "series", "service", "session", "settle", "setup", "seven", "shadow", "shaft", "shallow", "share", "shed", "shell", "sheriff", "shield", "shift", "shine", "ship", "shiver", "shock", "shoe", "shoot", "shop", "short", "shoulder", "shove", "shrimp", "shrug", "shuffle", "shy", "sibling", "sick", "side", "siege", "sight", "sign", "silent", "silk", "silly", "silver", "similar", "simple", "since", "sing", "siren", "sister", "situate", "six", "size", "skate", "sketch", "ski", "skill", "skin", "skirt", "skull", "slab", "slam", "sleep", "slender", "slice", "slide", "slight", "slim", "slogan", "slot", "slow", "slush", "small", "smart", "smile", "smoke", "smooth", "snack", "snake", "snap", "sniff", "snow", "soap", "soccer", "social", "soft", "solar", "soldier", "solid", "solution", "solve", "someone", "song", "soon", "sorry", "sort", "soul", "sound", "soup", "source", "south", "space", "spare", "spatial", "spawn", "speak", "special", "speed", "spell", "spend", "sphere", "spice", "spider", "spike", "spin", "spirit", "split", "spoil", "sponsor", "spoon", "sport", "spot", "spray", "spread", "spring", "spy", "square", "squeeze", "squirrel", "stable", "stadium", "staff", "stage", "stairs", "stamp", "stand", "start", "state", "stay", "steak", "steel", "stem", "step", "stereo", "stick", "still", "sting", "stock", "stomach", "stone", "stool", "stop", "store", "storm", "story", "stove", "strategy", "street", "strike", "strong", "struggle", "student", "stuff", "stumble", "style", "subject", "submit", "subway", "success", "such", "sudden", "suffer", "sugar", "suggest", "suit", "summer", "sun", "sunny", "sunset", "super", "supply", "support", "sure", "surf", "surge", "surprise", "surround", "survey", "suspect", "sustain", "swallow", "swamp", "swap", "swarm", "swear", "sweet", "swift", "swim", "swing", "switch", "sword", "symbol", "symptom", "syrup", "system", "table", "tackle", "tag", "tail", "talent", "talk", "tank", "tape", "target", "task", "taste", "tattoo", "taxi", "teach", "team", "tell", "ten", "tenant", "tennis", "tent", "term", "test", "text", "thank", "that", "theme", "then", "theory", "there", "they", "thing", "this", "thought", "three", "thrive", "throw", "thumb", "thunder", "ticket", "tide", "tiger", "tilt", "timber", "time", "tiny", "tip", "tired", "tissue", "title", "toast", "tobacco", "today", "toddler", "toe", "together", "toilet", "token", "tomato", "tomorrow", "tone", "tongue", "tonight", "tool", "tooth", "top", "topic", "topple", "torch", "tornado", "tortoise", "total", "tourist", "toward", "tower", "town", "toy", "track", "trade", "traffic", "tragic", "train", "transfer", "trap", "trash", "travel", "tray", "treat", "tree", "trend", "trial", "tribe", "trick", "trigger", "trim", "trip", "trophy", "trouble", "truck", "true", "truly", "trumpet", "trust", "truth", "try", "tube", "tuition", "tumble", "tuna", "tunnel", "turkey", "turn", "turtle", "twelve", "twenty", "twice", "twin", "twist", "two", "type", "typical", "ugly", "umbrella", "unable", "unaware", "uncle", "uncover", "under", "undo", "unfair", "unfold", "unhappy", "uniform", "unique", "unit", "universe", "unknown", "unlock", "until", "unusual", "unveil", "update", "upgrade", "uphold", "upon", "upper", "upset", "urban", "urge", "usage", "use", "used", "useful", "useless", "usual", "utility", "vacant", "vacuum", "vague", "valid", "valley", "valve", "van", "vanish", "vapor", "various", "vast", "vault", "vector", "vegetable", "vehicle", "velvet", "vendor", "venture", "venue", "verb", "verify", "version", "very", "vessel", "veteran", "viable", "vibrant", "vicious", "victory", "video", "view", "village", "vintage", "violin", "virtual", "virus", "visa", "visit", "visual", "vital", "vivid", "vocal", "voice", "void", "volcano", "volume", "vote", "voyage", "wage", "wagon", "wait", "walk", "wall", "walnut", "want", "warfare", "warm", "warrior", "wash", "wasp", "waste", "water", "wave", "way", "wealth", "weapon", "wear", "weasel", "weather", "web", "wedding", "weekend", "weekly", "weigh", "weird", "welcome", "west", "wet", "whale", "what", "wheat", "wheel", "when", "where", "whip", "whisper", "wide", "width", "wife", "wild", "will", "win", "window", "wine", "wing", "wink", "winner", "winter", "wire", "wisdom", "wise", "wish", "witness", "wolf", "woman", "wonder", "wood", "wool", "word", "work", "world", "worry", "worth", "wrap", "wreck", "wrestle", "wrist", "write", "wrong", "yard", "year", "yellow", "you", "young", "youth", "zebra", "zero", "zone", "zoo"
]

const VOWELS = "aeiou"
const CONSONANTS = "bcdfghjklmnpqrstvwxyz"

export function PasswordGenerator() {
  const [mode, setMode] = useState<PasswordMode>("random")
  const [password, setPassword] = useState("")
  const [bulkPasswords, setBulkPasswords] = useState<string[]>([])
  const [isBulk, setIsBulk] = useState(false)
  const [bulkCount, setBulkCount] = useState(10)
  
  const [pwnedCount, setPwnedCount] = useState<number | null>(null)
  const [checkingPwned, setCheckingPwned] = useState(false)
  
  // Random Settings
  const [length, setLength] = useState(16)
  const [useUpper, setUseUpper] = useState(true)
  const [useLower, setUseLower] = useState(true)
  const [useNums, setUseNums] = useState(true)
  const [useSyms, setUseSyms] = useState(true)
  
  // Passphrase Settings
  const [wordCount, setWordCount] = useState(4)
  const [separator, setSeparator] = useState("-")
  const [capitalize, setCapitalize] = useState(false)
  const [includeNumber, setIncludeNumber] = useState(false)
  const [includeSymbol, setIncludeSymbol] = useState(false)

  const { copiedId, copy } = useCopyToClipboard()
  const { download } = useDownload()

  const [zxcvbnResult, setZxcvbnResult] = useState<any>(null)

  useEffect(() => {
    if (!password) {
      setZxcvbnResult(null)
      return
    }
    let isCurrent = true
    import("zxcvbn").then(({ default: zxcvbn }) => {
      if (isCurrent) setZxcvbnResult(zxcvbn(password))
    })
    return () => { isCurrent = false }
  }, [password])

  const strength = zxcvbnResult?.score ?? 0
  const strengthLabel = ["Very Weak", "Weak", "Fair", "Strong", "Very Strong"][strength]
  const strengthColor = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-emerald-400", "bg-blue-500"][strength]
  const timeToCrack = zxcvbnResult?.crack_times_display.offline_fast_hashing_1e10_per_second ?? ""

  const entropyBits = useMemo(() => {
    if (!password) return 0
    if (mode === "random" || mode === "pronounceable") {
      let pool = 0
      if (useUpper) pool += 26
      if (useLower) pool += 26
      if (useNums) pool += 10
      if (useSyms) pool += 33
      if (pool === 0) pool = 26
      return Math.floor(Math.log2(pool) * length)
    } else {
      let pool = WORDS.length
      let bits = Math.log2(pool) * wordCount
      if (includeNumber) bits += Math.log2(10)
      if (includeSymbol) bits += Math.log2(33)
      return Math.floor(bits)
    }
  }, [password, mode, length, wordCount, includeNumber, includeSymbol, useUpper, useLower, useNums, useSyms])

  const generateSingle = useCallback(() => {
    let result = ""
    const array = new Uint32Array(128)
    window.crypto.getRandomValues(array)
    let ai = 0

    if (mode === "random") {
      const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
      const lower = "abcdefghijklmnopqrstuvwxyz"
      const nums = "0123456789"
      const syms = "!@#$%^&*()_+~`|}{[]:;?><,./-="
      let chars = ""
      if (useUpper) chars += upper
      if (useLower) chars += lower
      if (useNums) chars += nums
      if (useSyms) chars += syms
      if (!chars) chars = lower

      for (let i = 0; i < length; i++) {
        result += chars[array[ai++] % chars.length]
      }
    } else if (mode === "passphrase") {
      const parts = []
      for (let i = 0; i < wordCount; i++) {
        let w = WORDS[array[ai++] % WORDS.length]
        if (capitalize) w = w.charAt(0).toUpperCase() + w.slice(1)
        parts.push(w)
      }
      if (includeNumber) parts.push(Math.floor(array[ai++] % 100))
      if (includeSymbol) parts.push("!@#$%^&*()"[array[ai++] % 10])
      result = parts.join(separator)
    } else {
      for (let i = 0; i < length; i++) {
        const source = i % 2 === 0 ? CONSONANTS : VOWELS
        result += source[array[ai++] % source.length]
      }
    }
    return result
  }, [mode, length, useUpper, useLower, useNums, useSyms, wordCount, separator, capitalize, includeNumber, includeSymbol])

  const generate = useCallback(() => {
    if (isBulk) {
      const batch = Array.from({ length: bulkCount }).map(() => generateSingle())
      setBulkPasswords(batch)
      setPassword(batch[0])
    } else {
      setPassword(generateSingle())
    }
  }, [isBulk, bulkCount, generateSingle])

  useEffect(() => {
    generate()
  }, [mode, length, useUpper, useLower, useNums, useSyms, wordCount, separator, capitalize, includeNumber, includeSymbol, isBulk, bulkCount])

  const checkPwned = async () => {
    if (!password) return
    setCheckingPwned(true)
    setPwnedCount(null)
    try {
      const encoder = new TextEncoder()
      const data = encoder.encode(password)
      const hashBuffer = await crypto.subtle.digest('SHA-1', data)
      const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase()
      const prefix = hashHex.substring(0, 5)
      const suffix = hashHex.substring(5)
      const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`)
      if (!res.ok) throw new Error()
      const text = await res.text()
      const match = text.split('\n').find(line => line.split(':')[0] === suffix)
      setPwnedCount(match ? parseInt(match.split(':')[1], 10) : 0)
    } catch (e) {
      toast.error("Failed to check Pwned API")
    } finally {
      setCheckingPwned(false)
    }
  }

  return (
    <ToolLayout title="Security Architect" description="Generate enterprise-grade passwords and passphrases with entropy metrics." icon={KeyRound} centered maxWidth="max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-20">
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-black/20 space-y-8">
            <PillToggle activeId={mode} onChange={(id) => setMode(id as PasswordMode)} options={[{ id: "random", label: "Complex", icon: Fingerprint }, { id: "passphrase", label: "Passphrase", icon: List }, { id: "pronounceable", label: "Speakable", icon: Type }]} />

            <div className="space-y-6">
              {mode === "passphrase" ? (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center"><label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Words: {wordCount}</label></div>
                    <input type="range" min="3" max="10" value={wordCount} onChange={e => setWordCount(parseInt(e.target.value))} className="w-full accent-primary" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                     <button onClick={() => setCapitalize(!capitalize)} className={cn("py-3 rounded-xl text-[10px] font-black uppercase border transition-all", capitalize ? "bg-primary/20 border-primary/50 text-primary" : "bg-white/5 border-white/5 text-muted-foreground")}>Capitalize</button>
                     <button onClick={() => setIncludeNumber(!includeNumber)} className={cn("py-3 rounded-xl text-[10px] font-black uppercase border transition-all", includeNumber ? "bg-primary/20 border-primary/50 text-primary" : "bg-white/5 border-white/5 text-muted-foreground")}>Numbers</button>
                     <button onClick={() => setIncludeSymbol(!includeSymbol)} className={cn("py-3 rounded-xl text-[10px] font-black uppercase border transition-all", includeSymbol ? "bg-primary/20 border-primary/50 text-primary" : "bg-white/5 border-white/5 text-muted-foreground")}>Symbols</button>
                     <div className="flex bg-white/5 border border-white/10 rounded-xl overflow-hidden px-3 py-2 items-center">
                        <span className="text-[9px] font-black text-muted-foreground mr-2">SEP:</span>
                        <input value={separator} onChange={e => setSeparator(e.target.value)} className="w-full bg-transparent border-none outline-none text-xs font-mono text-center text-primary" maxLength={1} />
                     </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center"><label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Length: {length}</label></div>
                    <input type="range" min="8" max="64" value={length} onChange={e => setLength(parseInt(e.target.value))} className="w-full accent-primary" />
                  </div>
                  {mode === "random" && (
                    <div className="grid grid-cols-2 gap-2">
                      {[{ l: "A-Z", s: useUpper, f: setUseUpper }, { l: "a-z", s: useLower, f: setUseLower }, { l: "0-9", s: useNums, f: setUseNums }, { l: "!@#", s: useSyms, f: setUseSyms }].map(opt => (
                        <button key={opt.l} onClick={() => opt.f(!opt.s)} className={cn("py-2.5 rounded-xl text-[10px] font-black border transition-all", opt.s ? "bg-primary/20 border-primary/50 text-primary" : "bg-white/5 border-white/5 text-muted-foreground")}>{opt.l}</button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="pt-8 border-t border-white/5 space-y-4">
               <button onClick={() => setIsBulk(!isBulk)} className={cn("w-full py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border transition-all flex items-center justify-center gap-2", isBulk ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-white/5 border-white/10 text-muted-foreground")}>
                 {isBulk ? "Batch Mode Active" : "Enable Batch Generation"}
               </button>
               {isBulk && <input type="number" value={bulkCount} onChange={e => setBulkCount(Math.max(1, parseInt(e.target.value) || 1))} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-center text-xs font-mono text-primary" />}
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-6">
           <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-black/20 space-y-10">
              <div className="relative">
                 <div className="w-full bg-black/60 border border-white/5 rounded-[2.5rem] p-10 font-mono text-3xl text-white text-center break-all min-h-[160px] flex items-center justify-center shadow-inner relative z-10">
                    {password}
                 </div>
                 <div className="absolute -top-3 -right-3 flex gap-2 z-20">
                    <button onClick={generate} className="p-3 bg-black/80 backdrop-blur-xl border border-white/10 rounded-full text-muted-foreground hover:text-primary hover:scale-110 transition-all"><RefreshCw className="w-5 h-5" /></button>
                    <button onClick={() => copy(password, 'single')} className="p-3 bg-primary border border-primary/50 rounded-full text-white shadow-xl shadow-primary/30 hover:scale-110 transition-all">{copiedId === 'single' ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}</button>
                 </div>
                 <div className="absolute inset-0 bg-primary/5 blur-[100px] rounded-full -z-10" />
              </div>

              <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-3">
                    <div className="flex justify-between items-center"><span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Strength</span> <span className={cn("text-[9px] font-black uppercase", strengthColor.replace('bg-', 'text-'))}>{strengthLabel}</span></div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden flex gap-0.5">
                       {Array.from({ length: 5 }).map((_, i) => <div key={i} className={cn("h-full flex-1 transition-all duration-700", i <= strength ? strengthColor : "bg-white/5")} />)}
                    </div>
                 </div>
                 <div className="space-y-3">
                    <div className="flex justify-between items-center"><span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Entropy</span> <span className="text-[9px] font-black text-emerald-400 uppercase">{entropyBits} Bits</span></div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                       <div className="h-full bg-emerald-400 transition-all duration-700" style={{ width: `${Math.min(100, (entropyBits / 128) * 100)}%` }} />
                    </div>
                 </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                 <button onClick={checkPwned} disabled={checkingPwned} className="flex-1 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                    {checkingPwned ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />} {pwnedCount === null ? "Check Compromise" : pwnedCount > 0 ? "Leaked!" : "Secure"}
                 </button>
                 {pwnedCount !== null && <div className={cn("flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center border", pwnedCount > 0 ? "bg-red-500/10 border-red-500/30 text-red-400" : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400")}>{pwnedCount > 0 ? `Found ${pwnedCount.toLocaleString()} times` : "0 matches in leaks"}</div>}
              </div>

              {isBulk && (
                <div className="space-y-4 pt-10 border-t border-white/5">
                   <div className="flex items-center justify-between"><label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Batch Production ({bulkPasswords.length})</label><button onClick={() => download(bulkPasswords.join("\n"), "passwords.txt")} className="text-[10px] font-black uppercase text-primary hover:underline flex items-center gap-2"><Download className="w-4 h-4" /> Export TXV</button></div>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-auto custom-scrollbar pr-2">
                      {bulkPasswords.map((p, i) => (
                        <div key={i} className="bg-black/40 border border-white/5 rounded-xl px-4 py-3 flex items-center justify-between group">
                           <span className="font-mono text-[10px] text-white/50 group-hover:text-white transition-colors">{p}</span>
                           <button onClick={() => copy(p, `bulk-${i}`)} className="opacity-0 group-hover:opacity-100 transition-all">{copiedId === `bulk-${i}` ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground hover:text-white" />}</button>
                        </div>
                      ))}
                   </div>
                </div>
              )}
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-6 bg-white/[0.02] rounded-3xl border border-white/5 text-center space-y-2"><Sparkles className="w-5 h-5 text-primary mx-auto" /><h5 className="text-[10px] font-black uppercase text-white">Quantum Safe</h5><p className="text-[9px] text-muted-foreground leading-relaxed uppercase font-bold tracking-tight">High entropy prevents brute force.</p></div>
              <div className="p-6 bg-white/[0.02] rounded-3xl border border-white/5 text-center space-y-2"><Hash className="w-5 h-5 text-emerald-400 mx-auto" /><h5 className="text-[10px] font-black uppercase text-white">Zero Trust</h5><p className="text-[9px] text-muted-foreground leading-relaxed uppercase font-bold tracking-tight">Generated locally via CSPRNG.</p></div>
              <div className="p-6 bg-white/[0.02] rounded-3xl border border-white/5 text-center space-y-2"><KeyRound className="w-5 h-5 text-sky-400 mx-auto" /><h5 className="text-[10px] font-black uppercase text-white">Speaks 2FA</h5><p className="text-[9px] text-muted-foreground leading-relaxed uppercase font-bold tracking-tight">Ideal for master keys.</p></div>
           </div>
        </div>
      </div>
    </ToolLayout>
  )
}
