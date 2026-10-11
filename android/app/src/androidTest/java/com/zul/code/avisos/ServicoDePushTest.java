package com.zul.code.avisos;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import android.Manifest;
import android.app.Notification;
import android.app.NotificationManager;
import android.content.Context;
import android.os.Build;
import android.service.notification.StatusBarNotification;

import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;

import org.junit.Test;
import org.junit.runner.RunWith;

import java.util.HashMap;
import java.util.Map;

/**
 * O aviso do servidor sai com a cara do ZulCode, no canal de novidades, sem
 * precisar do Firebase para testar: os dados são os que o servidor manda.
 */
@RunWith(AndroidJUnit4.class)
public class ServicoDePushTest {

    @Test
    public void mostraOAvisoDoServidor() throws Exception {
        Context contexto = InstrumentationRegistry.getInstrumentation().getTargetContext();
        // No Android 13+ o aviso precisa da permissão, que uma instalação nova não tem.
        if (Build.VERSION.SDK_INT >= 33) {
            InstrumentationRegistry.getInstrumentation().getUiAutomation()
                .grantRuntimePermission(contexto.getPackageName(), Manifest.permission.POST_NOTIFICATIONS);
        }
        NotificationManager gerente = contexto.getSystemService(NotificationManager.class);
        gerente.cancelAll();

        Map<String, String> dados = new HashMap<>();
        dados.put("notificationId", "teste-push");
        dados.put("zc_titulo", "Novidade no ZulCode");
        dados.put("zc_texto", "Chegaram aulas novas de JavaScript.");
        dados.put("zc_rota", "https://fora.do.app");
        assertTrue(ServicoDePush.mostrar(contexto, dados));
        Thread.sleep(500);

        StatusBarNotification achada = null;
        for (StatusBarNotification n : gerente.getActiveNotifications()) {
            if ("Novidade no ZulCode".equals(n.getNotification().extras.getString(Notification.EXTRA_TITLE))) achada = n;
        }
        assertTrue("o aviso não apareceu", achada != null);
        assertEquals(Avisos.CANAL_NOVIDADES, achada.getNotification().getChannelId());
        assertEquals(0xFF1892FF, achada.getNotification().color);

        // Sem título não há aviso.
        dados.remove("zc_titulo");
        assertFalse(ServicoDePush.mostrar(contexto, dados));
        gerente.cancelAll();
    }
}
