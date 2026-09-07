<section class="publications" aria-labelledby="publications">
  <h2 id="publications">Selected Publications</h2>
  <p class="publication-legend">* Equal contribution &nbsp; · &nbsp; † Project lead</p>
  {% assign has_video = false %}
  <ol class="publication-list">
    {% for publication in site.data.publications.main %}
    {% assign publication_url = publication.blog | default: publication.page | default: publication.pdf | default: publication.code %}
    <li class="publication{% unless publication.image or publication.video_embed or publication.animation %} publication-no-image{% endunless %}">
      {% if publication.animation %}
      <div class="publication-image publication-video publication-video-loop">
        <iframe src="{{ publication.animation | relative_url }}?teaser=1" title="{{ publication.title | escape }} — LIBERO decoding animation" width="200" height="200" allow="autoplay"></iframe>
      </div>
      {% elsif publication.video_embed %}
      {% if publication.video_preview %}
      <div class="publication-image publication-video publication-video-loop">
        <iframe src="{{ publication.video_preview | escape }}" title="{{ publication.title | escape }} — muted video preview" width="200" height="200" allow="autoplay; encrypted-media" referrerpolicy="strict-origin-when-cross-origin"></iframe>
      </div>
      {% else %}
      {% assign has_video = true %}
      <a class="publication-image publication-video" href="{{ publication.video_url | escape }}" data-video-embed="{{ publication.video_embed | escape }}" data-video-title="{{ publication.title | escape }}" aria-label="Play video: {{ publication.title | escape }}">
        <img src="{{ publication.video_poster | escape }}" alt="" loading="lazy" decoding="async" width="180" height="120">
        <span class="video-play" aria-hidden="true">▶</span>
      </a>
      {% endif %}
      {% elsif publication.image %}
      <a class="publication-image" href="{{ publication_url }}" tabindex="-1" aria-hidden="true">
        <img src="{{ publication.image | relative_url }}" alt="" loading="lazy" decoding="async" width="180" height="120">
      </a>
      {% endif %}
      <div class="publication-info">
        <h3><a href="{{ publication_url }}">{{ publication.title }}</a></h3>
        {% if publication.authors_short %}
        <details class="publication-authors">
          <summary>{{ publication.authors_short }} <span class="author-toggle">Full author list</span></summary>
          <p>{{ publication.authors }}</p>
        </details>
        {% else %}
        <p class="publication-authors">{{ publication.authors }}</p>
        {% endif %}
        {% if publication.conference %}<p class="publication-venue"><em>{{ publication.conference }}</em></p>{% endif %}
        {% if publication.notes and publication.notes != 'Accept' %}<p class="publication-note">{{ publication.notes }}</p>{% endif %}
        <div class="publication-links">
          {% if publication.pdf %}<a href="{{ publication.pdf }}">paper</a>{% endif %}
          {% if publication.code %}<a href="{{ publication.code }}">code</a>{% endif %}
          {% if publication.blog %}<a href="{{ publication.blog }}">blog</a>{% elsif publication.page %}<a href="{{ publication.page }}">project page</a>{% endif %}
          {% if publication.bibtex %}<a href="{{ publication.bibtex }}">bibtex</a>{% endif %}
        </div>
        {% if publication.others %}<div class="publication-other">{{ publication.others }}</div>{% endif %}
      </div>
    </li>
    {% endfor %}
  </ol>
  <p class="all-publications">See the full publication list on <a href="{{ site.google_scholar }}">Google Scholar</a>.</p>
</section>
{% if has_video %}
<dialog class="video-dialog" id="publication-video-dialog" aria-labelledby="video-dialog-title">
  <div class="video-dialog-header">
    <h2 id="video-dialog-title">Research video</h2>
    <button type="button" class="video-close" aria-label="Close video">Close</button>
  </div>
  <iframe title="Research video" width="640" height="360" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
</dialog>
<script src="{{ '/assets/js/publication-video.js' | relative_url }}" defer></script>
{% endif %}
