---
published: true
title: My First NPM Packages
layout: post
---

After years of using Github & NPM, it feels great to finally start contributing some packages back.

I've helped out on a few repos here and there in the past via forks and pull-requests,
but never submitted anything from scratch, and never registered anything on NPM.

Anyway, so today I bundled up 2 little jQuery utilities I've been using a lot the past few months at work.

I had to refactor them for a project at work anyway, so I thought I might as well turn them into sharable code.

There's a third plugin I'm working on, but I haven't published it to NPM just yet because it's still a work in progress.

Without further ado, here's the Github links to the 3 repos:

1. [per-word-action \<https://github.com/jakedowns/per-word-action\>](https://github.com/jakedowns/per-word-action)

    This one could easily be called per-line-action or something as well, since it allows you to dynamically count and act upon every single word and each individual line of a given element.
    It's a little heavy-handed, and needs optimized. But it has come in handy far too often for me to keep it to myself. :P

1. [ellipsizer \<https://github.com/jakedowns/ellipsizer\>](https://github.com/jakedowns/ellipsizer)

    This one is built on top of `per-word-action`, and it dynamically clamps a section of text with an automatic "Read More / Read Less" toggle based on a maximum number of lines.
    It's not perfect, but a good start, and seems to fill some gaps where other packages have been abandoned or dropped the ball.

1. [pull-quote-center \<https://github.com/jakedowns/pull-quote-center\>](https://github.com/jakedowns/pull-quote-center)

    This one is also built on `per-word-action` (hence why I decided it was time to modularize that one), and it too is kind of an extreme hack for a simple effect.
    Until browsers get their sh*t together around [CSS Shapes](http://caniuse.com/#feat=css-exclusions) & [Exclusions](http://caniuse.com/#feat=css-exclusions) , this is the next best way to pull off a `float: center` effect between two columns of text.
    It needs some refactoring and some finessing, but I'm still pretty proud that it works at all even as a proof of concept.