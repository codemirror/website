!{"type": "examples", "title": "CodeMirror Collaborative Example", "injectCode": ["./collab.ts", "./worker.ts"]}

# Example: Collaborative Editing

<style>
  #server {
    width: max-content;
    padding: 2px 13px;
    background: #85a;
    color: white;
    border-radius: 8px;
  }
  #server select, #server button {
    border: 1px solid white;
    border-radius: 3px;
    color: white;
    font: inherit;
    background: inherit;
  }
  #editors {
    padding-top: 10px;
    overflow: hidden;
  }
  .editor {
    margin-top: 10px;
    padding-left: 80px;
    position: relative;
  }
  .editor:before {
    position: absolute;
    left: 10px; top: -1000px; bottom: 40px; width: 80px;
    border-left: 5px solid #85a;
    border-bottom: 5px solid #85a;
    border-radius: 0 0 0 18px;
    content: "";
    pointer-events: none;
  }
  .editor.cut:before {
    width: 40px;
  }
  .cut-control {
    position: absolute;
    left: 35px; bottom: 15px;
  }
  .cm-scroller {
    min-height: 50px;
  }
</style>

<div id=server>
  <span style="font-size: 150%; font-weight: bold">Server</span>
  <label style="margin-left: 1em">Latency ≈ <select id=latency>
    <option value=10>10ms</option>
    <option value=50 selected>50ms</option>
    <option value=250>250ms</option>
  </select></label>
  <button id=addpeer style="margin-left: 1em">Add peer</button>
</div>
<div id=editors></div>
<script defer src="../../codemirror.js"></script>
<script defer src="collab.js"></script>

