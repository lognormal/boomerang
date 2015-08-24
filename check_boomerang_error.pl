#!/usr/bin/perl

use strict;
use warnings;

my %lines = ();

while(<>) {
	next unless /ERROR \[.+?\] \[com\.soasta\.rum\.collector\.beacon\.(?:u\]|\w+\].*boomerang-\d\.\d+\.\d+ )/;
	next if /Throttled-log/;
	s/(a frame with origin ").*?(")/$1****$2/g;
	s/.*\[com\.soasta\.rum\.collector\.beacon\.\w+\] //;
	s/https?:(\/\/c\.go-mpulse\.net\/boomerang\/)[A-Z0-9-]+/$1boomerang.js/;
	chomp;
	s/\r$//;

	s/ \S*(Mozilla|Opera)\/.*//;
	s/;bcsi.*//;

	next unless $_;

	$_ =~ s/%([\da-fA-F]{2})/chr(hex($1))/ge;

	my $boomr;
	my $b = "--";

	my $l = $_;

	if ($l =~ /^(boomerang-\d\.\d+\.\d+) (.*)/) {
		$b = $boomr = $1;

		$l = $2;
	}

	$l =~ s/(\(\*\d+\))(\[\D)/$1\n$2/g;
	$l =~ s/(.)(\[[A-Za-z][\w\.:<>-]*\])/$1\n$2/g;

	$b =~ s/(boomerang-\d\.\d+\.)(\d+)/my @t=gmtime $2; sprintf "(%04d-%02d-%02d) %s%s", $t[5]+1900, $t[4]+1, $t[3], $1, $2;/e;

	my @lines = split /\n/, $l;

	for my $line (@lines) {

		my $count = 1;

		$line = "$boomr $line" if $boomr;

		if ($line =~ /^(.*)\(\*(\d+)\)$/) {
			$count = $2;
			$line = $1;
		}

		$count = 1 unless $count;

		if ($line =~ /\[Throttled-log\] incidents: (\d+) -- (.*)/) {
			$count *= $1;
			$line = $2;
		}

		$line =~ s/^(boomerang-\d\.\d+\.\d+ \[.+?):\d+/$1/;

		$line =~ s/SecurityError: Blocked.*/cross-origin-iframe-access/;
		$line =~ s/\[rt.getBoomerangTimings.*"Failure"\s*nsresult.*/Firefox 31 anonymous iframe window.performance bug/;

		$line =~ s/(Permiso denegado|Autorizzazione negata|Permission refusÃ©e|Permission refusée|EngedÃ©ly megtagadva|Dostop zavrnjen|Pr.+stup bol odmietnut|Tilladelse nÃ¦gtet|Opr.* odep.*|Ingen tilgang|PermissÃ£o negada|Erlaubnis verweigert.|Toegang geweigerd|Brak uprawnie|Ã.+tkomst nekad.|Ei kÃ¤yttÃ¶oikeutta|Ä°zin verilmedi|書き込みできません).*$/Permission denied/;
		$line =~ s/TypeError: (ì|æ|Ð|â|è°|å|Î¡).*/TypeError: Permission denied/;

		$line =~ s/(Access is denied\.|Adgang nÃ¦gtet\.|Accesso negato\.|Acceso denegado\.|EriÅŸim engellendi\.|AccÃ¨s refusÃ©\.|Odmowa dost.*pu\.|Acesso negado\.|KÃ¤yttÃ¶ estetty\.|Zugriff verweigert|Toegang geweigerd\.|アクセスが拒否されました|EriÅŸim engellendi\.|P.+stup byl odep.+en.|Dostop je zavrnjen\.|Prieiga u.+drausta\.|A hozz.+s megtagadva\.|Piek.+uve liegta\.|Acces refuzat\.|PrÃ­stup je odmietnut).*$/Access is denied/;
		$line =~ s/ Error: (ì|æ|Ð|ã|å­|â).*/ Error: Access is denied/;

		$line =~ s/TypeError: (.*bjet ne gÃ¨re pas la propriÃ©tÃ© ou la mÃ©thode Â« match Â»|El objeto no acepta la propiedad o el mÃ©todo 'match'|O objeto nÃ£o suporta a propriedade nem o mÃ©todo 'match'|å¯¹è±¡ä.*matchâ|ã.*'match'|De eigenschap of methode match wordt niet ondersteund door dit object|Das Objekt unterst.+tzt die Eigenschaft oder Methode "match" nicht|Predmet ne podpira lastnosti ali metode Â»matchÂ«|Nesne, 'match' Ã¶zelliÄŸini veya yÃ¶ntemini desteklemez|Obiekt nie obsÅ‚uguje wÅ‚aÅ›ciwoÅ›ci lub metody â€žmatchâ€|L'oggetto non supporta la proprietÃ  o il metodo 'match').*/TypeError: Object doesn't support property or method 'match'/;

		$line =~ s/ undefined / 'undefined' /g;

		$line =~ s/(Sandbox access violation).*/$1/;

		$line =~ s/Error: (Det er ikke nok plass til å fullføre denne operasjonen.)/Error: Not enough storage is available to complete this operation./;
		$line =~ s/Error: (Not enough storage )/$1/;

		$line =~ s/^\s+//;
		$line =~ s/\s+$//;

		$line = "$1 no-error-msg" if $line =~ /^(boomerang-\d\.\d+\.\d+)\s*$/;
		$line = "no-error-msg" if $line =~ /^\s*$/;

		$line = "$1 error-msg-clipped" if $line =~ /^(boomerang-\d\.\d+\.\d+) \[[^\]]*$/;
		$line = "$1 error-msg-clipped" if $line =~ /^(boomerang-\d\.\d+\.\d+) \[[^\]]+\] \S{0,10}$/;
		$line = "$1 error-msg-clipped" if $line =~ /^(boomerang-\d\.\d+\.\d+) \[[^\]]+\] Sec.{0,11}$/;
		$line = "$1 error-msg-clipped" if $line =~ /^(boomerang-\d\.\d+\.\d+) \[[^\]]+\] SecurityError:.{0,7}$/;

		$line =~ s/^boomerang-\d\.\d+\.\d+ //;

		$lines{$b} = {} unless $lines{$b};

		$lines{$b}{$line} = ($lines{$b}{$line} || 0) + $count;
	}
}


print map {
	my $boomr = $_;
	sprintf "\n%s:\n%s", $boomr, join "", map {
		unless (/\[PageVars.findResource\] TypeError: Permission denied/) {
			sprintf "%8d %s\n", $lines{$boomr}{$_}, $_;
		}
		else {
			"";
		}
	} sort {
		$lines{$boomr}{$b} <=> $lines{$boomr}{$a};
	} keys %{$lines{$boomr}};
} sort {
	$b cmp $a;
} keys %lines; 

