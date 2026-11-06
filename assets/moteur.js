(function () {
  var d = document, racine = d.documentElement, hero = d.body.dataset.hero, entete = d.querySelector('.entete');

  function majEntete() { entete.classList.toggle('est-scrolle', scrollY > innerHeight * .75); }
  addEventListener('scroll', majEntete, { passive: true });
  majEntete();
  commandes();
  catalogue();

  // Sans animations (librairie absente ou réglage du visiteur), le site reste complet et lisible.
  if (!window.gsap || !window.ScrollTrigger || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    racine.classList.remove('js');
    d.querySelectorAll('.vol-calque').forEach(function (c, i, tous) { c.style.zIndex = tous.length - i; });
    portant(false);
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });

  if (window.Lenis) {
    var lenis = new Lenis({ lerp: .1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    d.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) { e.preventDefault(); lenis.scrollTo(a.getAttribute('href'), { duration: 1.6 }); });
    });
  }

  /* Entrée */
  var nom = d.querySelector('.intro-nom');
  nom.innerHTML = nom.textContent.split(' ').map(function (mot) {
    return '<b class="mot">' + Array.from(mot).map(function (l) { return '<span>' + l + '</span>'; }).join('') + '</b>';
  }).join(' ');
  var entree = gsap.timeline({
    paused: true,
    onComplete: function () { d.querySelector('.intro').remove(); ScrollTrigger.refresh(); }
  });
  // Le rideau attend les photos du haut de page, deux secondes au maximum si la connexion est lente.
  gsap.from('.intro-nom span', { yPercent: 125, stagger: .035, duration: .7, ease: 'power4.out' });
  var aCharger = gsap.utils.toArray('.hi img').filter(function (i) { return !i.complete; });
  var lancer = function () { entree.play(); };
  gsap.delayedCall(.9, function () {
    Promise.race([
      Promise.all(aCharger.map(function (i) { return i.decode ? i.decode().catch(function () {}) : Promise.resolve(); })),
      new Promise(function (ok) { setTimeout(ok, 2000); })
    ]).then(lancer);
  });
  entree
    .to('.intro', { yPercent: -100, duration: .9, ease: 'expo.inOut' })
    .from('.hi img', { scale: 1.28, duration: 1.7, ease: 'power3.out' }, '-=.75')
    .from('.ligne>span', { yPercent: 115, stagger: .08, duration: 1, ease: 'power4.out' }, '-=1.4')
    .from('.hero .sur,.hero .chapo,.hero .btn', { autoAlpha: 0, y: 18, stagger: .07, duration: .7, ease: 'power2.out' }, '-=.7');

  var mm = gsap.matchMedia();

  /* Héros au scroll : chaque style a son mouvement */
  var finHero = { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true };
  if (hero === 'plein') {
    gsap.fromTo('.hero-images', { clipPath: 'inset(0% 0% 0% 0% round 0px)' }, { clipPath: 'inset(7% 4% 7% 4% round 26px)', ease: 'none', scrollTrigger: finHero });
    gsap.to('.hero-texte', { y: -90, ease: 'none', scrollTrigger: finHero });
  }
  if (hero === 'duo') {
    gsap.to('.hero-images', { yPercent: -10, ease: 'none', scrollTrigger: finHero });
    gsap.to('.hero-texte', { yPercent: 12, ease: 'none', scrollTrigger: finHero });
  }
  if (hero === 'ecrin') {
    mm.add({ grand: '(min-width:761px)', petit: '(max-width:760px)' }, function (c) {
      var depart = c.conditions.grand ? 'inset(15% 33% 15% 33% round 400px)' : 'inset(11% 10% 11% 10% round 200px)';
      gsap.timeline({ scrollTrigger: { trigger: '.hero', pin: true, start: 'top top', end: '+=110%', scrub: .6 } })
        .fromTo('.hero-images', { clipPath: depart }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none', duration: 1 })
        .to('.hero-texte', { autoAlpha: 0, y: -50, duration: .3 }, .68);
    });
  }
  if (hero === 'affiche') {
    gsap.to('.ligne:nth-child(1)', { xPercent: -14, ease: 'none', scrollTrigger: finHero });
    gsap.to('.ligne:nth-child(2)', { xPercent: 14, ease: 'none', scrollTrigger: finHero });
    gsap.to('.hero-images', { y: -50, ease: 'none', scrollTrigger: finHero });
  }
  if (hero === 'collage') {
    gsap.utils.toArray('.hi').forEach(function (h, i) {
      gsap.to(h, { y: [-170, -300, -110, -220][i % 4], rotate: [-3, 3, 2, -2][i % 4], ease: 'none', scrollTrigger: finHero });
    });
  }

  /* Le texte s'allume mot à mot */
  var manifeste = d.querySelector('.manifeste p');
  manifeste.innerHTML = manifeste.textContent.trim().split(/\s+/).map(function (m) { return '<span>' + m + '</span>'; }).join(' ');
  gsap.fromTo('.manifeste span', { opacity: .14 }, {
    opacity: 1, stagger: .05, ease: 'none',
    scrollTrigger: { trigger: '.manifeste', start: 'top 72%', end: 'bottom 62%', scrub: true }
  });

  /* Le vol : on traverse les images en zoomant, sans vidéo */
  var calques = gsap.utils.toArray('.vol-calque'), etapes = gsap.utils.toArray('.vol-etape');
  calques.forEach(function (c, i) { c.style.zIndex = calques.length - i; });
  var vol = gsap.timeline({ scrollTrigger: { trigger: '.vol', pin: true, start: 'top top', end: '+=' + calques.length * 115 + '%', scrub: .7 } });
  calques.forEach(function (c, i) {
    var img = c.querySelector('img'), texte = etapes[i], dernier = i === calques.length - 1;
    if (i) vol.fromTo(img, { scale: .8 }, { scale: 1, duration: .3, ease: 'power1.out' }, i - .3);
    vol.to(img, { scale: 1.22, duration: .7, ease: 'none' }, i);
    vol.fromTo(texte, { autoAlpha: 0, y: 44 }, { autoAlpha: 1, y: 0, duration: .22, ease: 'power2.out' }, i ? i - .02 : 0);
    if (!dernier) {
      vol.to(texte, { autoAlpha: 0, y: -44, duration: .14 }, i + .58);
      vol.to(img, { scale: 3.1, duration: .3, ease: 'power2.in' }, i + .7);
      vol.to(c, { autoAlpha: 0, duration: .15 }, i + .85);
    }
  });

  portant(true);

  /* Collection */
  if (d.body.dataset.collection === 'rail') {
    mm.add('(min-width:761px)', function () {
      var rail = d.querySelector('.collection-liste');
      var marge = parseFloat(getComputedStyle(rail.parentNode).paddingLeft);
      var distance = function () { return Math.max(0, rail.scrollWidth - innerWidth + marge * 2); };
      var course = gsap.to(rail, {
        x: function () { return -distance(); }, ease: 'none',
        scrollTrigger: { trigger: '.collection', pin: true, start: 'top top', end: function () { return '+=' + distance(); }, scrub: .6, invalidateOnRefresh: true }
      });
      gsap.utils.toArray('.piece').forEach(function (p) {
        gsap.fromTo(p.querySelector('img'), { xPercent: -7 }, {
          xPercent: 7, ease: 'none',
          scrollTrigger: { trigger: p, containerAnimation: course, start: 'left right', end: 'right left', scrub: true }
        });
      });
    });
  } else if (d.body.dataset.collection !== 'catalogue') {
    gsap.utils.toArray('.piece').forEach(function (p) {
      gsap.fromTo(p.querySelector('.piece-image'), { clipPath: 'inset(100% 0% 0% 0%)' }, {
        clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'expo.out',
        scrollTrigger: { trigger: p, start: 'top 85%', once: true }
      });
      gsap.fromTo(p.querySelector('img'), { yPercent: -6, scale: 1.14 }, {
        yPercent: 6, ease: 'none', scrollTrigger: { trigger: p, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });
  }
  gsap.from('.collection-tete > *', { autoAlpha: 0, y: 34, stagger: .1, duration: .9, ease: 'power3.out', scrollTrigger: { trigger: '.collection', start: 'top 80%', once: true } });

  /* Bandeau et contact */
  gsap.to('.defile', { xPercent: -50, duration: 24, repeat: -1, ease: 'none' });
  gsap.from('.contact-corps > *', { autoAlpha: 0, y: 26, stagger: .1, duration: .8, scrollTrigger: { trigger: '.contact-corps', start: 'top 92%', once: true } });

  /* Bouton aimanté à la souris */
  if (matchMedia('(hover:hover) and (pointer:fine)').matches) {
    d.querySelectorAll('.btn').forEach(function (b) {
      b.addEventListener('mousemove', function (e) {
        var r = b.getBoundingClientRect();
        gsap.to(b, { x: (e.clientX - r.left - r.width / 2) * .25, y: (e.clientY - r.top - r.height / 2) * .35, duration: .4 });
      });
      b.addEventListener('mouseleave', function () { gsap.to(b, { x: 0, y: 0, duration: .7, ease: 'elastic.out(1,.4)' }); });
    });
  }

  addEventListener('load', function () { ScrollTrigger.refresh(); });

  /* Commande : le client choisit sa taille et le message WhatsApp s'écrit tout seul */
  function commandes() {
    d.querySelectorAll('.commande').forEach(preparerCommande);
  }
  function preparerCommande(bloc) {
    var lien = bloc.querySelector('.commande-lien'), zone = bloc.querySelector('.tailles'),
      aide = bloc.querySelector('.commande-aide'), zoneCouleur = bloc.querySelector('.couleurs'),
      taille = '', couleur = '';

    function majLien() {
      if (!bloc.dataset.wa) return;
      var texte = ['Bonjour ' + bloc.dataset.boutique + ', je voudrais commander :', 'Modèle : ' + bloc.dataset.nom];
      if (taille) texte.push('Taille : ' + taille);
      texte.push('Couleur : ' + (couleur || 'à préciser'));
      texte.push('Prix : ' + bloc.dataset.prix);
      if (bloc.dataset.photo) texte.push('Photo : ' + bloc.dataset.photo);
      lien.href = bloc.dataset.wa + '?text=' + encodeURIComponent(texte.join('\n'));
    }
    function afficherCouleurs() {
      zoneCouleur.innerHTML = '';
      couleur = '';
      var champ = d.createElement('input');
      champ.className = 'couleur-champ';
      champ.type = 'text';
      champ.maxLength = 30;
      champ.placeholder = 'Écrivez la couleur voulue';
      champ.setAttribute('aria-label', 'Couleur voulue');
      champ.addEventListener('input', function () {
        couleur = champ.value.trim();
        majLien();
      });
      if (bloc.dataset.couleurs) {
        // Couleurs annoncées par le commerce : des pastilles, sans champ libre.
        var pastilles = bloc.dataset.couleurs.split(',').map(function (c) {
          var nom = c.split(':')[0], teinte = c.split(':')[1];
          var b = d.createElement('button'), rond = d.createElement('i');
          b.type = 'button';
          b.className = 'couleur-choix pastille';
          rond.style.background = teinte;
          b.appendChild(rond);
          b.appendChild(d.createTextNode(nom));
          b.setAttribute('aria-pressed', 'false');
          b.addEventListener('click', function () {
            pastilles.forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
            b.setAttribute('aria-pressed', 'true');
            couleur = nom;
            majLien();
          });
          zoneCouleur.appendChild(b);
          return b;
        });
        return;
      }
      if (bloc.dataset.couleurPhoto === '0') {
        zoneCouleur.appendChild(champ);
        return;
      }
      champ.hidden = true;
      var choix = [
        { texte: 'Comme sur la photo', valeur: 'comme sur la photo' },
        { texte: 'Une autre couleur', valeur: '' }
      ];
      var boutons = choix.map(function (c) {
        var b = d.createElement('button');
        b.type = 'button';
        b.className = 'couleur-choix' + (c.valeur ? '' : ' autre');
        b.textContent = c.texte;
        b.setAttribute('aria-pressed', 'false');
        b.addEventListener('click', function () {
          boutons.forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
          b.setAttribute('aria-pressed', 'true');
          champ.hidden = !!c.valeur;
          couleur = c.valeur || champ.value.trim();
          majLien();
          if (!c.valeur) champ.focus();
        });
        zoneCouleur.appendChild(b);
        return b;
      });
      zoneCouleur.appendChild(champ);
    }
    function afficher() {
      zone.innerHTML = '';
      taille = '';
      bloc.classList.remove('manque');
      afficherCouleurs();
      var tailles = bloc.dataset.tailles ? bloc.dataset.tailles.split(',') : [];
      aide.textContent = bloc.dataset.aide || (tailles.length ? 'Choisissez votre taille' : '');
      tailles.forEach(function (t) {
        var b = d.createElement('button');
        b.type = 'button';
        b.className = 'taille';
        b.textContent = t;
        b.setAttribute('aria-pressed', 'false');
        b.addEventListener('click', function () {
          zone.querySelectorAll('.taille').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
          b.setAttribute('aria-pressed', 'true');
          bloc.classList.remove('manque');
          aide.textContent = 'Taille ' + t + ' choisie';
          taille = t;
          majLien();
        });
        zone.appendChild(b);
      });
      majLien();
    }
    lien.addEventListener('click', function (e) {
      var attendue = bloc.dataset.tailles && !zone.querySelector('[aria-pressed=true]');
      if (!attendue) return;
      e.preventDefault();
      bloc.classList.remove('manque');
      void bloc.offsetWidth;
      bloc.classList.add('manque');
    });
    bloc.afficher = afficher;
    afficher();
  }

  /* Catalogue : filtres par catégorie et fenêtre de commande */
  function catalogue() {
    var fiche = d.querySelector('.fiche');
    if (!fiche) return;
    var filtres = d.querySelectorAll('.filtre'), produits = d.querySelectorAll('.produit'),
      commande = fiche.querySelector('.commande');

    filtres.forEach(function (f) {
      f.addEventListener('click', function () {
        filtres.forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
        f.setAttribute('aria-pressed', 'true');
        produits.forEach(function (p) {
          p.hidden = !!f.dataset.categorie && p.dataset.categorie !== f.dataset.categorie;
        });
        if (window.ScrollTrigger) ScrollTrigger.refresh();
      });
    });

    produits.forEach(function (p) {
      p.addEventListener('click', function (e) {
        e.preventDefault();
        var img = p.querySelector('img');
        fiche.querySelector('.fiche-image').src = img.currentSrc || img.src;
        fiche.querySelector('.fiche-image').alt = p.dataset.nom;
        fiche.querySelector('.fiche-nom').textContent = p.dataset.nom;
        fiche.querySelector('.fiche-detail').textContent = p.dataset.detail;
        fiche.querySelector('.fiche-prix').textContent = p.dataset.prix;
        ['nom', 'prix', 'tailles', 'aide', 'photo', 'couleurPhoto', 'couleurs'].forEach(function (cle) {
          commande.dataset[cle] = p.dataset[cle];
        });
        commande.afficher();
        fiche.showModal();
        fiche.scrollTop = 0;
        if (lenis) lenis.stop();
      });
    });

    fiche.addEventListener('close', function () { if (lenis) lenis.start(); });
    fiche.querySelector('.fiche-fermer').addEventListener('click', function () { fiche.close(); });
    fiche.addEventListener('click', function (e) { if (e.target === fiche) fiche.close(); });
  }

  /* Portant : chaque cintre est un petit pendule poussé par le mouvement du portant */
  function portant(anime) {
    var piste = d.querySelector('.portant-piste');
    if (!piste) return;
    var cintres = Array.from(d.querySelectorAll('.cintre'));
    var pendules = cintres.map(function (c, i) {
      return { corps: c.querySelector('.cintre-corps'), angle: 0, vitesse: 0, force: .85 + (i % 3) * .14 };
    });
    var nom = d.querySelector('.portant-nom'), detail = d.querySelector('.portant-detail'),
      prix = d.querySelector('.portant-prix'), commande = d.querySelector('.portant .commande'),
      points = d.querySelectorAll('.portant-points span');
    var ancienX = piste.scrollLeft, ancienY = scrollY, actif = 0, visible = false, enMarche = false, dernier = 0;

    function pousser(valeur) {
      if (!anime) return;
      pendules.forEach(function (p) { p.vitesse += valeur * p.force; });
      lancer();
    }
    function lancer() {
      if (enMarche || !visible) return;
      enMarche = true;
      dernier = performance.now();
      requestAnimationFrame(image);
    }
    function image(t) {
      var dt = Math.min((t - dernier) / 1000, .04), energie = 0;
      dernier = t;
      pendules.forEach(function (p) {
        // Rappel vers la verticale et frottement : le cintre oscille puis s'arrête seul.
        p.vitesse += (-46 * p.angle - 2.1 * p.vitesse) * dt;
        p.angle = Math.max(-20, Math.min(20, p.angle + p.vitesse * dt));
        p.corps.style.transform = 'rotate(' + p.angle.toFixed(2) + 'deg)';
        energie += Math.abs(p.angle) + Math.abs(p.vitesse) * .1;
      });
      if (energie > .05 && visible) requestAnimationFrame(image);
      else enMarche = false;
    }
    function majActif() {
      var centre = piste.getBoundingClientRect().left + piste.clientWidth / 2, meilleur = 0, ecart = Infinity;
      cintres.forEach(function (c, i) {
        var r = c.getBoundingClientRect(), e = Math.abs(r.left + r.width / 2 - centre);
        if (e < ecart) { ecart = e; meilleur = i; }
      });
      if (meilleur === actif) return;
      points[actif].classList.remove('actif');
      points[meilleur].classList.add('actif');
      actif = meilleur;
      var c = cintres[actif];
      nom.textContent = c.dataset.nom;
      detail.textContent = c.dataset.detail;
      prix.textContent = c.dataset.prix;
      commande.dataset.nom = c.dataset.nom;
      commande.dataset.prix = c.dataset.prix;
      commande.dataset.tailles = c.dataset.tailles;
      commande.dataset.aide = c.dataset.aide;
      commande.dataset.photo = c.dataset.photo;
      commande.dataset.couleurPhoto = c.dataset.couleurPhoto;
      commande.dataset.couleurs = c.dataset.couleurs;
      commande.afficher();
    }

    piste.addEventListener('scroll', function () {
      var dx = piste.scrollLeft - ancienX;
      ancienX = piste.scrollLeft;
      pousser(-Math.max(-60, Math.min(60, dx)) * 1.5);
      majActif();
    }, { passive: true });
    addEventListener('scroll', function () {
      var dy = scrollY - ancienY;
      ancienY = scrollY;
      if (visible) pousser(Math.max(-30, Math.min(30, dy)) * .35);
    }, { passive: true });
    new IntersectionObserver(function (e) {
      visible = e[0].isIntersecting;
      if (visible) lancer();
    }).observe(piste);

    cintres.forEach(function (c, i) {
      c.addEventListener('pointerenter', function (e) {
        if (anime && e.pointerType === 'mouse') { pendules[i].vitesse += 34; lancer(); }
      });
      c.addEventListener('click', function () {
        if (piste.dataset.tire === '1') return;
        c.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      });
    });

    /* À la souris, on attrape le portant et on le tire, comme au doigt sur téléphone */
    var depart = 0, departScroll = 0, tient = false;
    piste.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse') return;
      tient = true;
      depart = e.clientX;
      departScroll = piste.scrollLeft;
      piste.dataset.tire = '0';
      piste.classList.add('en-prise');
    });
    addEventListener('pointermove', function (e) {
      if (!tient) return;
      if (Math.abs(e.clientX - depart) > 5) piste.dataset.tire = '1';
      piste.scrollLeft = departScroll - (e.clientX - depart);
    });
    addEventListener('pointerup', function () {
      tient = false;
      piste.classList.remove('en-prise');
    });

    if (anime) gsap.from('.cintre', {
      y: -70, autoAlpha: 0, stagger: .08, duration: .9, ease: 'back.out(1.5)',
      scrollTrigger: { trigger: '.portant-scene', start: 'top 80%', once: true },
      onComplete: function () { pousser(26); }
    });
  }
})();
