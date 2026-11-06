"""Fabrique les sites : une fiche dans clients/ donne une page HTML.
Usage : python construire.py
"""
import json
import re
import unicodedata
from html import escape as e
from pathlib import Path
from urllib.parse import quote

ICI = Path(__file__).parent
SORTIE = ICI  # les pages sont écrites à côté de ce script
STUDIO = "https://kayfess-studio.vercel.app"


def photo(ref, largeur=1200):
    # Un identifiant Unsplash pour les démos, un chemin ou une URL pour les vraies photos du client.
    if "/" in ref or "." in ref:
        return ref
    return f"https://images.unsplash.com/photo-{ref}?w={largeur}&q=68&auto=format&fit=crop"


def image(ref, alt, sizes="100vw", charge='loading="lazy"'):
    if "/" in ref or "." in ref:
        srcset = ""
    else:
        srcset = " srcset=\"" + ", ".join(f"{photo(ref, w)} {w}w" for w in (640, 1024, 1600)) + f"\" sizes=\"{sizes}\""
    return f'<img src="{photo(ref)}"{srcset} alt="{e(alt)}" decoding="async" {charge}>'


def lien_whatsapp(s, message=None):
    if s.get("whatsapp"):
        return f"https://wa.me/{s['whatsapp']}?text=" + quote(message or f"Bonjour {s['nom']}, je viens de votre site.")
    return "#contact"


def identifiant(nom):
    simple = unicodedata.normalize("NFKD", nom).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "-", simple).strip("-")


def lien_modele(s, piece):
    # Page d'un modèle : le commerce voit la photo depuis le message WhatsApp.
    if not s.get("url"):
        return ""
    return f"{s['url'].rstrip('/')}/modele/{s['fichier']}/{identifiant(piece['nom'])}"


def message_commande(s, piece, taille=""):
    lignes = [f"Bonjour {s['nom']}, je voudrais commander :", f"Modèle : {piece['nom']}"]
    if taille:
        lignes.append(f"Taille : {taille}")
    lignes.append(f"Prix : {piece['prix']}")
    if lien_modele(s, piece):
        lignes.append(f"Photo : {lien_modele(s, piece)}")
    return "\n".join(lignes)


def attributs_modele(s, piece):
    return (
        f'data-nom="{e(piece["nom"])}" data-prix="{e(piece["prix"])}" data-tailles="{e(piece.get("tailles", ""))}" '
        f'data-aide="{e(piece.get("aide_taille", ""))}" data-photo="{e(lien_modele(s, piece))}" '
        f'data-couleur-photo="{1 if piece.get("couleur_photo", True) else 0}" data-couleurs="{e(piece.get("couleurs", ""))}"'
    )


def catalogue(s):
    # Grille filtrable : chaque carte ouvre la fenêtre de commande, ou la page du modèle sans JavaScript.
    c = s["collection"]
    filtres = '<button class="filtre" type="button" aria-pressed="true" data-categorie="">Tout</button>' + "".join(
        f'<button class="filtre" type="button" aria-pressed="false" data-categorie="{e(n)}">{e(n)}</button>' for n in c["categories"]
    )
    cartes = "".join(
        f'<a class="produit" href="modele/{s["fichier"]}/{identifiant(p["nom"])}.html" data-categorie="{e(p["categorie"])}" '
        f'data-detail="{e(p["detail"])}" {attributs_modele(s, p)}>'
        f'<span class="produit-image"><img src="{e(p["photo"])}" alt="{e(p["nom"])}" loading="lazy" decoding="async"></span>'
        f'<span class="produit-nom titre">{e(p["nom"])}</span><span class="produit-prix">{e(p["prix"])}</span></a>'
        for p in c["pieces"]
    )
    premiere = c["pieces"][0]
    return f"""<section class="collection catalogue" id="catalogue"><div class="collection-tete"><h2 class="titre">{e(c['titre'])}</h2><p>{e(c['texte'])}</p></div>
<div class="filtres" role="group" aria-label="Filtrer par catégorie">{filtres}</div>
<div class="catalogue-grille">{cartes}</div>
<dialog class="fiche" data-lenis-prevent aria-label="Commander cet article"><button class="fiche-fermer" type="button" aria-label="Fermer">×</button>
<img class="fiche-image" src="{e(premiere['photo'])}" alt=""><div class="fiche-corps"><h3 class="titre fiche-nom">{e(premiere['nom'])}</h3><p class="fiche-detail">{e(premiere['detail'])}</p><strong class="fiche-prix">{e(premiere['prix'])}</strong>{bloc_commande(s, premiere)}</div></dialog>
</section>
"""


def bloc_commande(s, piece):
    # Choix de la taille et bouton WhatsApp : la partie « Commande » de assets/moteur.js compose le message.
    tailles = "".join(
        f'<button class="taille" type="button" aria-pressed="false">{e(t)}</button>'
        for t in piece.get("tailles", "").split(",")
        if t
    )
    numero = f"https://wa.me/{s['whatsapp']}" if s.get("whatsapp") else ""
    cible = ' target="_blank" rel="noopener"' if s.get("whatsapp") else ""
    return (
        f'<div class="commande" {attributs_modele(s, piece)} data-boutique="{e(s["nom"])}" data-wa="{numero}">'
        f'<div class="tailles" role="group" aria-label="Choisir la taille">{tailles}</div>'
        f'<p class="commande-aide">{e(piece.get("aide_taille", ""))}</p>'
        '<div class="couleurs" role="group" aria-label="Choisir la couleur"></div>'
        f'<a class="btn commande-lien" href="{e(lien_whatsapp(s, message_commande(s, piece)))}"{cible}>Commander sur WhatsApp</a>'
        "</div>"
    )


def page_modele(s, piece):
    t = s["theme"]
    image = piece.get("photo_partage") or piece["photo"]
    absolue = f"{s['url'].rstrip('/')}/{image}"
    return f"""<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{e(piece['nom'])} | {e(s['nom'])}</title><meta name="robots" content="noindex">
<meta name="description" content="{e(piece['detail'])}, {e(piece['prix'])}">
<meta property="og:title" content="{e(piece['nom'])} : {e(piece['prix'])}"><meta property="og:description" content="{e(s['nom'])}, {e(piece['detail'])}">
<meta property="og:image" content="{e(absolue)}">
<style>*{{box-sizing:border-box}}body{{margin:0;background:{t['fond']};color:{t['texte']};font:17px/1.5 system-ui,sans-serif;padding:16px}}
main{{max-width:520px;margin:auto;display:grid;gap:10px}}img{{width:100%;display:block;border-radius:8px}}h1{{margin:6px 0 0;font-size:1.6rem}}p{{margin:0}}a{{color:inherit}}strong{{font-size:1.2rem}}</style></head>
<body><main><img src="../../{e(image)}" alt="{e(piece['nom'])}"><h1>{e(piece['nom'])}</h1><p>{e(piece['detail'])}</p><strong>{e(piece['prix'])}</strong><p><a href="{e(s['url'])}">Voir tout le site de {e(s['nom'])}</a></p></main></body></html>
"""


CINTRE = (
    '<svg class="cintre-crochet" viewBox="0 0 120 58" aria-hidden="true"><path d="M60 26V17a8 8 0 1 0-8-8" fill="none" '
    'stroke="currentColor" stroke-width="3" stroke-linecap="round"/><path d="M60 26 6 50q-5 3 0 5h108q5-2 0-5Z" '
    'fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/></svg>'
)


def portant(s):
    # Vêtements détourés suspendus à une barre : voir la partie « Portant » de assets/moteur.js.
    p = s.get("portant")
    if not p:
        return ""
    cintres = ""
    for i, v in enumerate(p["pieces"]):
        cintres += (
            f'<button class="cintre" type="button" aria-label="{e(v["nom"])}, {e(v["prix"])}" '
            f'{attributs_modele(s, v)} data-detail="{e(v["detail"])}">'
            f'<span class="cintre-corps">{CINTRE}<span class="cintre-tenue"><img src="{photo(v["photo"])}" alt="{e(v["nom"])}" '
            f'decoding="async" draggable="false"></span><span class="cintre-etiquette">{e(v["prix"])}</span></span></button>'
        )
    premiere = p["pieces"][0]
    points = "".join(f'<span{" class=actif" if i == 0 else ""}></span>' for i in range(len(p["pieces"])))
    fond = f' style="--portant-fond:{e(p["fond"])}"' if p.get("fond") else ""
    return f"""<section class="portant" aria-label="{e(p['titre'])}"{fond}>
<div class="portant-tete"><h2>{e(p['titre'])}</h2><p>{e(p['texte'])}</p></div>
<div class="portant-scene"><div class="portant-barre" aria-hidden="true"></div><div class="portant-piste" tabindex="0">{cintres}</div></div>
<div class="portant-points" aria-hidden="true">{points}</div>
<div class="portant-info" aria-live="polite"><div><h3 class="titre portant-nom">{e(premiere['nom'])}</h3><p class="portant-detail">{e(premiere['detail'])}</p></div>
<strong class="portant-prix">{e(premiere['prix'])}</strong>{bloc_commande(s, premiere)}</div>
</section>
"""


def version(fichier):
    # Force le navigateur à recharger un fichier quand il a changé.
    return f"assets/{fichier}?v={int((ICI / 'assets' / fichier).stat().st_mtime)}"


def page(s):
    t = s["theme"]
    wa = lien_whatsapp(s)
    cible = ' target="_blank" rel="noopener"' if s.get("whatsapp") else ""
    lignes = "".join(f'<span class="ligne"><span>{e(l)}</span></span>' for l in s["hero"]["titre"])
    images_hero = "".join(
        f'<div class="hi">{image(r, a, "60vw", charge="fetchpriority=high" if i == 0 else "")}</div>'
        for i, (r, a) in enumerate(s["hero"]["images"])
    )
    calques = "".join(f'<div class="vol-calque">{image(v["photo"], v["alt"], charge="")}</div>' for v in s["vol"])
    etapes = "".join(
        f'<div class="vol-etape"><p class="sur">{e(v["petit"])}</p><h2 class="titre">{e(v["titre"])}</h2></div>'
        for v in s["vol"]
    )
    pieces = "".join(
        f'<article class="piece"><div class="piece-image">{image(p["photo"], p["nom"], "(max-width:760px) 80vw, 40vw")}</div>'
        f'<h3 class="titre">{e(p["nom"])}</h3><p class="piece-ligne"><span>{e(p["detail"])}</span>'
        f'<span class="piece-prix">{e(p["prix"])}</span></p>{bloc_commande(s, p) if p.get("commande") else ""}</article>'
        for p in s["collection"]["pieces"]
    )
    if s["collection"].get("categories"):
        collection = catalogue(s)
    else:
        collection = (
            f'<section class="collection"><div class="collection-tete"><h2 class="titre">{e(s["collection"]["titre"])}</h2>'
            f'<p>{e(s["collection"]["texte"])}</p></div><div class="collection-liste">{pieces}</div></section>'
        )
    defile = "".join(f"<span>{e(s['contact']['bandeau'])}</span>" for _ in range(6))
    horaires = "<br>".join(e(h) for h in s["contact"]["horaires"])
    note = "" if s.get("whatsapp") else '<small class="note-demo">Démo : le numéro du commerce ira ici.</small>'
    # WhatsApp a besoin d'une adresse complète pour afficher la photo dans l'aperçu du lien.
    image_partage = photo(s["partage"] if s.get("partage") else s["hero"]["images"][0][0], 1200)
    if s.get("url") and not image_partage.startswith("http"):
        image_partage = s["url"].rstrip("/") + "/" + image_partage
    icone = "data:image/svg+xml," + quote(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="{t["accent"]}"/>'
        f'<text x="16" y="23" font-family="Georgia,serif" font-size="20" text-anchor="middle" fill="{t["sur_accent"]}">{e(s["nom"][0])}</text></svg>'
    )
    demo = s.get("demo", True)
    # Une démo reste hors de Google tant que le commerce n'a pas donné son accord.
    robots = '<meta name="robots" content="noindex">' if demo else ""
    if s.get("fictif"):
        mention = " : commerce fictif, site de démonstration"
    else:
        mention = " : proposition de site, non officielle" if demo else ""
    lien_instagram = ""
    if s.get("instagram"):
        lien_instagram = f'<a href="{e(s["instagram"])}" target="_blank" rel="noopener">Instagram</a>'

    return f"""<!doctype html>
<html lang="fr"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{e(s['nom'])} | {e(s['secteur'])} à {e(s['ville'])}</title>
<meta name="description" content="{e(s['hero']['chapo'])}">{robots}
<meta property="og:type" content="website"><meta property="og:title" content="{e(s['nom'])}"><meta property="og:description" content="{e(s['hero']['chapo'])}">
<meta property="og:image" content="{e(image_partage)}"><meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="{icone}">
<script>document.documentElement.classList.add('js')</script>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="{t['polices']}">
<link rel="stylesheet" href="{version('style.css')}">
<style>:root{{--fond:{t['fond']};--texte:{t['texte']};--texte-hero:{t['texte_hero']};--accent:{t['accent']};--sur-accent:{t['sur_accent']};--doux:{t['doux']};--police-titre:'{t['police_titre']}';--police-texte:'{t['police_texte']}';--titre-style:{t['titre_style']};--titre-graisse:{t['titre_graisse']};--titre-casse:{t['titre_casse']};--titre-espace:{t['titre_espace']};--titre-interligne:{t['titre_interligne']};--rayon:{t['rayon']}}}</style>
</head>
<body data-hero="{t['hero']}" data-collection="{t['collection']}">
<div class="intro" aria-hidden="true"><span class="intro-nom titre">{e(s['nom'])}</span></div>
<header class="entete"><a class="logo titre" href="#top">{e(s['nom'])}</a><a class="btn-mini" href="{wa}"{cible}>{e(s['contact']['bouton_court'])}</a></header>
{'<span class="badge-demo">Démo</span>' if s.get("demo", True) else ""}
<main id="top">
<section class="hero">
<div class="hero-images">{images_hero}</div>
<div class="hero-texte"><p class="sur">{e(s['hero']['sur'])}</p><h1 class="titre">{lignes}</h1><p class="chapo">{e(s['hero']['chapo'])}</p><a class="btn" href="{wa}"{cible}>{e(s['contact']['bouton'])}</a></div>
</section>
<section class="manifeste"><p class="titre">{e(s['manifeste'])}</p></section>
<section class="vol" aria-label="Découvrir {e(s['nom'])}">{calques}<div class="vol-texte"><div class="vol-grille">{etapes}</div></div></section>
{portant(s)}{collection}
<section class="contact" id="contact">
<div class="defile titre" aria-hidden="true">{defile}</div>
<div class="contact-corps">
<div><h3>Adresse</h3><p>{e(s['contact']['adresse'])}</p></div>
<div><h3>{e(s['contact'].get('horaires_titre', 'Horaires'))}</h3><p>{horaires}</p></div>
<div><h3>Contact</h3><a class="btn" href="{wa}"{cible}>{e(s['contact']['bouton'])}</a>{note}</div>
</div>
<footer class="pied"><span>© {e(s['nom'])}{mention}</span>{lien_instagram}<a href="{STUDIO}" target="_blank" rel="noopener">Site réalisé par Kayfess Studio</a></footer>
</section>
</main>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/lenis@1.1.13/dist/lenis.min.js"></script>
<script src="{version('moteur.js')}"></script>
</body></html>
"""


def galerie(sites):
    cartes = "".join(
        f'<a class="carte" href="{s["fichier"]}.html"><img src="{photo(s["hero"]["images"][0][0], 800)}" alt="">'
        f'<span class="carte-texte"><small>{e(s["secteur"])}</small><strong>{e(s["nom"])}</strong></span></a>'
        for s in sites
    )
    return f"""<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Modèles vitrines</title>
<style>
*{{box-sizing:border-box}}body{{margin:0;background:#0d0d0c;color:#f4f1ea;font:16px/1.5 system-ui,sans-serif;padding:clamp(24px,5vw,64px) 16px}}
.tout{{max-width:1240px;margin:auto}}h1{{font-size:clamp(2rem,5vw,3.6rem);line-height:1.08;margin:0 0 8px}}p{{margin:0 0 30px;color:#b9b4a8}}
.grille{{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:14px}}
.carte{{position:relative;display:block;height:400px;overflow:hidden;border-radius:12px;color:#fff;text-decoration:none}}
.carte img{{width:100%;height:100%;object-fit:cover;display:block;transition:transform .7s cubic-bezier(.2,.7,.2,1)}}.carte:hover img{{transform:scale(1.06)}}
.carte::after{{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 50%,rgba(0,0,0,.82))}}
.carte-texte{{position:absolute;z-index:1;left:18px;bottom:16px;display:grid}}strong{{font-size:1.5rem}}small{{opacity:.85}}
</style></head><body><div class="tout"><h1>5 modèles de sites vitrines</h1><p>Noms, prix et adresses sont fictifs. Clique sur un modèle pour le voir.</p><div class="grille">{cartes}</div></div></body></html>
"""


def main():
    sites = []
    for fiche in sorted((ICI / "clients").glob("*.json")):
        s = json.loads(fiche.read_text(encoding="utf-8"))
        s["fichier"] = fiche.stem
        (SORTIE / f"{fiche.stem}.html").write_text(page(s), encoding="utf-8")
        if s.get("url"):
            dossier = SORTIE / "modele" / fiche.stem
            dossier.mkdir(parents=True, exist_ok=True)
            for piece in s["collection"]["pieces"] + s.get("portant", {}).get("pieces", []):
                # La même pièce peut être dans les deux listes : la photo normale de la collection est gardée.
                cible = dossier / f"{identifiant(piece['nom'])}.html"
                if not cible.exists() or not piece["photo"].endswith(".webp"):
                    cible.write_text(page_modele(s, piece), encoding="utf-8")
        sites.append(s)
    (SORTIE / "index.html").write_text(galerie([s for s in sites if s.get("fictif")]), encoding="utf-8")
    print(f"{len(sites)} sites construits")


if __name__ == "__main__":
    main()
