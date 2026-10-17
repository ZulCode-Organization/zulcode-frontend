package com.zul.code.widget;

import com.zul.code.R;

/**
 * Qual arte do Zul aparece no widget. Cada situação tem o seu grupo de poses,
 * e dentro dele a pose muda de hora em hora: o widget nunca fica igual o dia
 * todo, mas também não fica sorteando a cada redesenho.
 */
final class PoseDoZul {

    /** Estudou hoje: o Zul comemora. */
    private static final int[] FEITO = {
        R.drawable.zul_pose_oculos, R.drawable.zul_pose_forte,
        R.drawable.zul_pose_equilibrio, R.drawable.zul_pose_coco, R.drawable.zul_pose_mergulho,
    };
    /** Tem ofensiva e ainda não estudou: o Zul está estudando, chamando para a lição. */
    private static final int[] RISCO = {
        R.drawable.zul_pose_lendo, R.drawable.zul_pose_escrevendo, R.drawable.zul_pose_lupa,
        R.drawable.zul_pose_correndo, R.drawable.zul_pose_lagarta,
    };
    /** Depois das 20h, com a ofensiva em risco: pressa. */
    private static final int[] NOITE = {
        R.drawable.zul_pose_correndo, R.drawable.zul_pose_escrevendo, R.drawable.zul_pose_derretido,
    };
    /** Sem ofensiva: um convite para começar. */
    private static final int[] COMECAR = {
        R.drawable.zul_pose_lendo, R.drawable.zul_pose_lupa, R.drawable.zul_pose_escrevendo,
        R.drawable.zul_pose_lagarta, R.drawable.zul_pose_equilibrio,
    };

    private PoseDoZul() {}

    static int escolher(Situacao s) {
        if (!s.temDados) return R.drawable.zul_pose_lendo;
        int[] grupo = s.feitoHoje ? FEITO : s.dias <= 0 ? COMECAR : s.noite ? NOITE : RISCO;
        return grupo[Math.floorMod(s.horaDoAno, grupo.length)];
    }
}
