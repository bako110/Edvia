package bf.edvia.app;

import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.LayerDrawable;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.webkit.JavascriptInterface;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    getBridge().getWebView().addJavascriptInterface(new Bars(), "EdviaNative");
  }

  // Appelé par l'application web. Quand Android décale la page sous la barre d'état, c'est le FOND DE LA FENÊTRE qui
  // se voit dans cette zone : on le colore (couleur de l'établissement en haut, couleur de la page ailleurs).
  private class Bars {
    @JavascriptInterface
    public void setBars(String brandHex, String pageHex) {
      runOnUiThread(() -> {
        try {
          int brand = Color.parseColor(brandHex), page = Color.parseColor(pageHex);
          View decor = getWindow().getDecorView();
          LayerDrawable layers = new LayerDrawable(new Drawable[] { new ColorDrawable(page), new ColorDrawable(brand) });
          layers.setLayerGravity(1, Gravity.TOP);
          layers.setLayerHeight(1, Math.max(decor.getPaddingTop(), 1));
          decor.setBackground(layers);
        } catch (Exception ignored) { /* couleur invalide : on ne change rien */ }
      });
    }
  }
}
